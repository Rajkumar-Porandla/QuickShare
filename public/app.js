const API_URL = '/api/share';

// ── Toast Notification System ────────────────────
(function () {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);

    window.showToast = function (message, type = 'info') {
        const prefixMap = { info: '// info', success: '// ok', error: '// err' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('data-prefix', prefixMap[type] || '//');
        toast.textContent = message;

        const bar = document.createElement('div');
        bar.className = 'toast-bar';
        toast.appendChild(bar);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.2s';
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    };
})();

// ── Tabs ─────────────────────────────────────────
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ── TEXT SHARING ─────────────────────────────────
const textInput = document.getElementById('text-input');
const shareTextBtn = document.getElementById('share-text-btn');
const textResult = document.getElementById('text-result');
const textShareCode = document.getElementById('text-share-code');
const retrieveTextBtn = document.getElementById('retrieve-text-btn');
const retrieveTextCode = document.getElementById('retrieve-text-code');

shareTextBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return showToast('Please enter some text!', 'info');
    setLoading(shareTextBtn, true);
    try {
        const res = await fetch(`${API_URL}/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.code) {
            textShareCode.textContent = data.code;
            textResult.classList.remove('hidden');
            showToast('Code generated!', 'success');
        } else {
            showToast('Error generating code', 'error');
        }
    } catch {
        showToast('Failed to share text', 'error');
    } finally {
        setLoading(shareTextBtn, false);
    }
});

const retrievedTextBox = document.getElementById('retrieved-text-box');
const retrievedTextContent = document.getElementById('retrieved-text-content');
const copyRetrievedText = document.getElementById('copy-retrieved-text');

retrieveTextBtn.addEventListener('click', async () => {
    const code = retrieveTextCode.value.trim();
    if (!code) return showToast('Enter a code!', 'info');
    setLoading(retrieveTextBtn, true);
    try {
        const res = await fetch(`${API_URL}/text/${code}`);
        const data = await res.json();
        if (data.text) {
            retrievedTextContent.textContent = data.text;
            retrievedTextBox.classList.remove('hidden');
            showToast('Text retrieved!', 'success');
        } else {
            showToast(data.error || 'Text not found', 'error');
        }
    } catch {
        showToast('Failed to retrieve text', 'error');
    } finally {
        setLoading(retrieveTextBtn, false);
    }
});

copyRetrievedText.addEventListener('click', () => {
    const text = retrievedTextContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
        copyRetrievedText.textContent = 'Copied!';
        setTimeout(() => copyRetrievedText.textContent = 'Copy', 2000);
    });
});

// ── IMAGE SHARING ────────────────────────────────
const imageDropZone = document.getElementById('image-drop-zone');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const imagePreviewContainer = document.getElementById('image-preview-container');
const shareImageBtn = document.getElementById('share-image-btn');
const imageResult = document.getElementById('image-result');
const imageShareCode = document.getElementById('image-share-code');
const retrieveImageBtn = document.getElementById('retrieve-image-btn');
const retrieveImageCode = document.getElementById('retrieve-image-code');

setupDragAndDrop(imageDropZone, imageInput);

imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
            shareImageBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
});

shareImageBtn.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) return;
    await uploadFile(file, shareImageBtn, imageResult, imageShareCode);
});

const retrievedImageBox = document.getElementById('retrieved-image-box');
const retrievedImagePreview = document.getElementById('retrieved-image-preview');
const retrievedImageName = document.getElementById('retrieved-image-name');
const downloadImageBtn = document.getElementById('download-image-btn');

retrieveImageBtn.addEventListener('click', async () => {
    const code = retrieveImageCode.value.trim();
    if (!code) return showToast('Enter a code!', 'info');
    setLoading(retrieveImageBtn, true);
    try {
        const res = await fetch(`${API_URL}/file/${code}/info`);
        const data = await res.json();
        if (data.originalName) {
            retrievedImagePreview.src = `${API_URL}/file/${code}/preview`;
            retrievedImageName.textContent = data.originalName;
            downloadImageBtn.href = `${API_URL}/file/${code}`;
            downloadImageBtn.download = data.originalName;
            retrievedImageBox.classList.remove('hidden');
            showToast('Image loaded!', 'success');
        } else {
            showToast(data.error || 'File not found', 'error');
        }
    } catch {
        showToast('Failed to retrieve image', 'error');
    } finally {
        setLoading(retrieveImageBtn, false);
    }
});

// ── FILE SHARING ─────────────────────────────────
const fileDropZone = document.getElementById('file-drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const shareFileBtn = document.getElementById('share-file-btn');
const fileResult = document.getElementById('file-result');
const fileShareCode = document.getElementById('file-share-code');
const retrieveFileBtn = document.getElementById('retrieve-file-btn');
const retrieveFileCode = document.getElementById('retrieve-file-code');

setupDragAndDrop(fileDropZone, fileInput);

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileInfo.classList.remove('hidden');
        shareFileBtn.disabled = false;
    }
});

shareFileBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    await uploadFile(file, shareFileBtn, fileResult, fileShareCode);
});

const retrievedFileBox = document.getElementById('retrieved-file-box');
const retrievedFileName = document.getElementById('retrieved-file-name');
const retrievedFileSize = document.getElementById('retrieved-file-size');
const retrievedFileType = document.getElementById('retrieved-file-type');
const downloadFileBtn = document.getElementById('download-file-btn');

retrieveFileBtn.addEventListener('click', async () => {
    const code = retrieveFileCode.value.trim();
    if (!code) return showToast('Enter a code!', 'info');
    setLoading(retrieveFileBtn, true);
    try {
        const res = await fetch(`${API_URL}/file/${code}/info`);
        const data = await res.json();
        if (data.originalName) {
            retrievedFileName.textContent = data.originalName;
            retrievedFileSize.textContent = formatBytes(data.size);
            retrievedFileType.textContent = data.mimeType;
            downloadFileBtn.href = `${API_URL}/file/${code}`;
            downloadFileBtn.download = data.originalName;
            retrievedFileBox.classList.remove('hidden');
            showToast('File info loaded!', 'success');
        } else {
            showToast(data.error || 'File not found', 'error');
        }
    } catch {
        showToast('Failed to retrieve file info', 'error');
    } finally {
        setLoading(retrieveFileBtn, false);
    }
});

// ── UTILS ────────────────────────────────────────
function setupDragAndDrop(zone, input) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

async function uploadFile(file, btn, resultBox, codeDisplay) {
    setLoading(btn, true);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch(`${API_URL}/file`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.code) {
            codeDisplay.textContent = data.code;
            resultBox.classList.remove('hidden');
            showToast('Uploaded! Share the code.', 'success');
        } else {
            showToast('Upload failed', 'error');
        }
    } catch {
        showToast('Upload failed', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;
    } else {
        btn.textContent = btn.dataset.originalText;
        btn.disabled = (btn === shareImageBtn || btn === shareFileBtn)
            ? !(imageInput.files[0] || fileInput.files[0])
            : false;
    }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const textToCopy = document.getElementById(btn.dataset.target).textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Code copied!', 'success');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 2000);
        });
    });
});
