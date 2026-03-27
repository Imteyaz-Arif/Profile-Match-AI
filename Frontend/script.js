document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const resumeInput = document.getElementById('resumeInput');
    const jdInput = document.getElementById('jdInput');
    const jdTextInput = document.getElementById('jdTextInput');
    const resumeFileName = document.getElementById('resumeFileName');
    const jdFileName = document.getElementById('jdFileName');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const errorMsg = document.getElementById('errorMsg');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const loader = analyzeBtn.querySelector('.loader-spinner');
    const resultSection = document.getElementById('resultSection');

    window.switchTab = function (btn) {
        btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        const card = btn.closest('.input-card');
        card.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        checkFormValidity();
    };

    // Handle file selection
    const handleFileSelect = (input, displayEl, boxId) => {
        if (input.files.length > 0) {
            const fileName = input.files[0].name;
            displayEl.textContent = fileName;
            document.getElementById(boxId).classList.add('has-file');
        } else {
            displayEl.textContent = '';
            document.getElementById(boxId).classList.remove('has-file');
        }
        checkFormValidity();
    };

    resumeInput.addEventListener('change', () => handleFileSelect(resumeInput, resumeFileName, 'resumeBox'));
    jdInput.addEventListener('change', () => handleFileSelect(jdInput, jdFileName, 'jdBox'));
    jdTextInput.addEventListener('input', () => checkFormValidity());

    // Enable button only if both files are selected
    const checkFormValidity = () => {
        const isResumeValid = resumeInput.files.length > 0;

        const activeJdTabBtn = document.querySelector('#jdContainer .tabs button[data-target].active');
        let isJdValid = false;

        if (activeJdTabBtn && activeJdTabBtn.getAttribute('data-target') === 'jdUploadView') {
            isJdValid = jdInput.files.length > 0;
        } else {
            isJdValid = jdTextInput.value.trim().length > 10;
        }

        if (isResumeValid && isJdValid) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    };

    // Drag and drop setup
    ['resumeBox', 'jdBox'].forEach(boxId => {
        const box = document.getElementById(boxId);
        const input = box.querySelector('input[type="file"]');

        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.classList.add('dragover');
        });

        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.classList.remove('dragover');
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                input.dispatchEvent(new Event('change'));
            }
        });
    });

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset UI state
        errorMsg.textContent = '';
        btnText.style.display = 'none';
        loader.style.display = 'block';
        analyzeBtn.disabled = true;
        resultSection.classList.add('hidden');

        const formData = new FormData();
        formData.append('resume', resumeInput.files[0]);

        const activeJdTabBtn = document.querySelector('#jdContainer .tabs button[data-target].active');
        if (activeJdTabBtn && activeJdTabBtn.getAttribute('data-target') === 'jdUploadView') {
            formData.append('jd', jdInput.files[0]);
        } else {
            formData.append('jd_text', jdTextInput.value.trim());
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Analysis failed. Please try again.');
            }

            const data = await response.json();
            document.body.classList.remove('locked-scroll');
            renderResults(data);
        } catch (err) {
            errorMsg.innerHTML = `<strong>API ERROR:</strong> ${err.message}`;
            analyzeBtn.disabled = false;
        } finally {
            btnText.style.display = 'block';
            loader.style.display = 'none';
            // Re-check validity after analyzing correctly enables form buttons logically
            checkFormValidity();
        }
    });

    function renderResults(data) {
        resultSection.innerHTML = `
            <h2>Analysis Results</h2>
            <div class="results-grid">
                <div class="scores-container">
                    <div class="score-box">
                        <div class="score-circle" id="matchCircle" style="background: conic-gradient(var(--secondary-color) 0%, transparent 0%);">
                            <span>${data.matchPercentage}%</span>
                        </div>
                        <p>Total Match</p>
                    </div>
                    <div class="score-box">
                        <div class="score-circle" id="shortlistCircle" style="background: conic-gradient(var(--primary-color) 0%, transparent 0%);">
                            <span>${data.likelyToShortlist}%</span>
                        </div>
                        <p>Likely to Shortlist</p>
                    </div>
                </div>
                
                <div class="details-container">
                    <div class="result-card">
                        <h3>Match Keywords</h3>
                        <div class="tags">
                            ${data.matchingKeywords && data.matchingKeywords.length > 0
                ? data.matchingKeywords.map(k => `<span class="tag match">${k}</span>`).join('')
                : '<span style="color: var(--text-secondary)">None found</span>'}
                        </div>
                    </div>
                    
                    <div class="result-card">
                        <h3>Missing Keywords</h3>
                        <div class="tags">
                            ${data.missingKeywords && data.missingKeywords.length > 0
                ? data.missingKeywords.map(k => `<span class="tag missing">${k}</span>`).join('')
                : '<span style="color: var(--text-secondary)">None missing</span>'}
                        </div>
                    </div>
                    
                    <div class="result-card">
                        <h3>Suggestions for Improvement</h3>
                        <ul class="suggestions-list">
                            ${data.suggestions && data.suggestions.length > 0
                ? data.suggestions.map(s => `
                                <li>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                    <span>${s}</span>
                                </li>
                            `).join('') : '<li>No suggestions at this time.</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        resultSection.classList.remove('hidden');

        // Animate the circles smoothly
        setTimeout(() => {
            document.getElementById('matchCircle').style.background = `conic-gradient(var(--secondary-color) ${data.matchPercentage}%, transparent 0%)`;
            document.getElementById('shortlistCircle').style.background = `conic-gradient(var(--primary-color) ${data.likelyToShortlist}%, transparent 0%)`;
        }, 100);

        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});