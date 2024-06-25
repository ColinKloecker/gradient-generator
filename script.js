document.addEventListener('DOMContentLoaded', function() {
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const directionSelect = document.getElementById('direction');
    const colorInputs = document.getElementById('colorInputs');
    const addColorBtn = document.getElementById('addColor');
    const numGradientsInput = document.getElementById('numGradients');
    const noiseMinInput = document.getElementById('noiseMin');
    const noiseMaxInput = document.getElementById('noiseMax');
    const gradientPreview = document.getElementById('gradientPreview');
    const generateBtn = document.getElementById('generateBtn');
    const alertDiv = document.getElementById('alert');
    const dimensionsDisplay = document.getElementById('dimensionsDisplay');

    function updatePreview() {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        const direction = directionSelect.value;
        const colors = Array.from(colorInputs.querySelectorAll('input[type="color"]')).map(input => input.value);

        gradientPreview.style.width = `${Math.min(width, 300)}px`;
        gradientPreview.style.height = `${Math.min(height, 150)}px`;

        let gradientDirection;
        switch(direction) {
            case 'horizontal':
                gradientDirection = 'to right';
                break;
            case 'vertical':
                gradientDirection = 'to bottom';
                break;
            case 'diagonal':
                gradientDirection = '45deg';
                break;
        }

        gradientPreview.style.background = `linear-gradient(${gradientDirection}, ${colors.join(', ')})`;
        dimensionsDisplay.textContent = `${width} x ${height}px`;
    }

    function addColorInput() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = `#${Math.floor(Math.random()*16777215).toString(16)}`;
        input.addEventListener('input', updatePreview);
        colorInputs.appendChild(input);
        updatePreview();
    }

    addColorBtn.addEventListener('click', addColorInput);

    [widthInput, heightInput, directionSelect, noiseMinInput, noiseMaxInput, numGradientsInput].forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Initialize with two color inputs
    addColorInput();
    addColorInput();

    generateBtn.addEventListener('click', function() {
        showAlert('Generating gradients...', 'info');
        
        const width = widthInput.value;
        const height = heightInput.value;
        const direction = directionSelect.value;
        const colors = Array.from(colorInputs.querySelectorAll('input[type="color"]')).map(input => input.value);
        const numGradients = numGradientsInput.value;
        const noiseMin = noiseMinInput.value;
        const noiseMax = noiseMaxInput.value;

        const url = `/generate?width=${width}&height=${height}&direction=${direction}&colors=${JSON.stringify(colors)}&num_gradients=${numGradients}&noise_min=${noiseMin}&noise_max=${noiseMax}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'gradients.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showAlert('Gradients generated and downloaded!', 'success');
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(`Error generating gradients: ${error.message}`, 'error');
            });
    });

    function showAlert(message, type) {
        alertDiv.textContent = message;
        alertDiv.className = `alert ${type}`;
        alertDiv.style.display = 'block';
    }

    updatePreview();
});