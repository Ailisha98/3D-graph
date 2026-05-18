function f(r, a, n, m) {
    return r * (Math.pow(r, n) * m / (Math.pow(r, n) * m + Math.pow(a, n) * (1 - m))) + 
           a * (1 - (Math.pow(r, n) * m / (Math.pow(r, n) * m + Math.pow(a, n) * (1 - m))));
}
// questa è per il secondo caso:
function isValidRA(params) {
    return params.r !== null &&
           params.a !== null &&
           Number.isFinite(params.r) &&
           Number.isFinite(params.a) &&
           params.r > params.a;
}

let currentFixedValues = JSON.parse(localStorage.getItem('fixedValues')) || {
    r: 0.5, a: 0.49, n: 10, m: 0.5, g: 0.5
};

let lastCameraView = null; // Non carichiamo nulla da localStorage inizialmente
const defaultCamera = {
    eye: { x: 8, y: -2.5, z: 1 }, // 👈 prospettiva più laterale e leggermente dall'alto
    up: { x: 0, y: 0, z: 0.2 },
    center: { x: 0, y: 0, z: 0 }
};

function generateData(variables, fixedValues) {
    let x_values = [], y_values = [], z_values = [], g_values = [];
    let step = 0.02, maxPoints = 5000, count = 0;

    for (let i = 0.0001; i <= 1; i += step) {
        let params = { ...fixedValues };
        params[variables.x] = i;

        if (variables.y) {
            for (let j = 0.0001; j <= 1; j += step) {
                params[variables.y] = j;

                // Constraint globale: il grafico esiste solo per r > a.
                // Se il punto corrente non soddisfa r > a, non lo disegniamo.
                if (!isValidRA(params)) {
                    continue;
                }

                let f_value = f(params.r, params.a, params.n, params.m);
                if (!Number.isFinite(f_value)) {
                    continue;
                }

                x_values.push(i);
                y_values.push(j);
                z_values.push(f_value);
                g_values.push(fixedValues.g);

                if (++count >= maxPoints) break;
            }
        } else {
            // Caso 2D: una sola variabile.
            // Anche qui il punto viene disegnato solo se r > a.
            if (!isValidRA(params)) {
                continue;
            }

            let f_value = f(params.r, params.a, params.n, params.m);
            if (!Number.isFinite(f_value)) {
                continue;
            }

            x_values.push(i);
            y_values.push(f_value);
            g_values.push(fixedValues.g);

            if (++count >= maxPoints) break;
        }

        if (count >= maxPoints) break;
    }

    return { x_values, y_values, z_values, g_values };
}

function plotGraph(selectedVariables, fixedValues) {
    let data = generateData(selectedVariables, fixedValues);
    let traces = [];
    if (data.x_values.length === 0) {
    showGraphError(`
        No valid points to plot.<br>
        This graph is defined only for r &gt; a.
    `);
    return;
}

    const isMobile = window.innerWidth <= 768;

    if (selectedVariables.y) {
        traces.push({
            x: data.x_values,
            y: data.y_values,
            z: data.z_values,
            type: 'mesh3d',
            name: `Function t(${selectedVariables.x}, ${selectedVariables.y})`,
            color: 'rgb(135, 206, 235)',
            opacity: 0.9,
            showlegend: true
        });

        traces.push({
            x: data.x_values,
            y: data.y_values,
            z: data.g_values,
            type: 'scatter3d',
            mode: 'markers',
            name: 'Threshold g',
            marker: { size: 2, color: 'red', opacity: 0.5 }
        });

        var layout = {
            showlegend: true,
            margin: { l: 40, r: 40, t: 40, b: 40 },
            scene: {
                aspectmode: 'manual',
                aspectratio: { x: 4, y: 4, z: 4 },
                xaxis: { title: selectedVariables.x, range: [0, 1], dtick: 0.2 },
                yaxis: { title: selectedVariables.y, range: [0, 1], dtick: 0.2 },
                zaxis: { title: `t(${selectedVariables.x}, ${selectedVariables.y})`, range: [0, 1], dtick: 0.2 },
                camera: lastCameraView || defaultCamera
            }
        };
    } else {
        traces.push({
            x: data.x_values,
            y: data.y_values,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'blue', width: 2 },
            name: `Function t(${selectedVariables.x})`
        });

        traces.push({
            x: data.x_values,
            y: data.g_values,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'red', width: 2, dash: 'dash' },
            name: 'Threshold g'
        });

        var layout = {
            showlegend: true,
            xaxis: {
                title: selectedVariables.x,
                range: [0, 1], dtick: 0.2,
                scaleanchor: 'y', scaleratio: 1, constrain: 'domain'
            },
            yaxis: {
                title: `t(${selectedVariables.x})`,
                range: [0, 1], dtick: 0.2,
                scaleanchor: 'x', scaleratio: 1, constrain: 'domain'
            }
        };
    }

 Plotly.react('grafico', traces, layout, {
    responsive: true,
    displayModeBar: false,
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage'],
    useWebGL: true,
    camera: defaultCamera // 👈 forza il reset alla tua camera
});
    document.getElementById('grafico').on('plotly_relayout', eventData => {
        if (eventData["scene.camera"]) {
            lastCameraView = eventData["scene.camera"];
            localStorage.setItem('cameraView', JSON.stringify(lastCameraView));
        }
    });
}

function getSelectedVariables() {
    let selected = Array.from(document.querySelectorAll('.var-select:checked')).map(el => el.value);
    if (selected.length > 2) {
        alert('Please select at most two variables to solve for.');
        return { x: selected[0], y: selected[1] || null };
    }
    return { x: selected[0], y: selected[1] || null };
}

function getFixedValues() {
    return { ...currentFixedValues };
}

function showGraphError(message) {
    Plotly.purge('grafico');

    document.getElementById('grafico').innerHTML = `
        <div style="
            display:flex;
            justify-content:center;
            align-items:center;
            height:100%;
            color:white;
            font-size:18px;
            padding:20px;
            text-align:center;
            line-height:1.4;
        ">
            ${message}
        </div>
    `;
}

function violatesRAConstraintWithSliders(selectedVariables, fixedValues) {
    const rIsSlider = selectedVariables.x !== 'r' && selectedVariables.y !== 'r';
    const aIsSlider = selectedVariables.x !== 'a' && selectedVariables.y !== 'a';

    return rIsSlider &&
           aIsSlider &&
           fixedValues.r !== null &&
           fixedValues.a !== null &&
           fixedValues.r <= fixedValues.a;
}

function updateGraph() {
    let selectedVariables = getSelectedVariables();

    ['r', 'a', 'n', 'm'].forEach(variable => {
        let sliderContainer = document.getElementById(variable + '-slider');
        sliderContainer.style.display = (selectedVariables.x === variable || selectedVariables.y === variable) ? 'none' : 'block';
    });

    currentFixedValues = {
        r: selectedVariables.x === 'r' || selectedVariables.y === 'r' ? null : parseFloat(document.getElementById('r').value),
        a: selectedVariables.x === 'a' || selectedVariables.y === 'a' ? null : parseFloat(document.getElementById('a').value),
        n: selectedVariables.x === 'n' || selectedVariables.y === 'n' ? null : parseFloat(document.getElementById('n').value),
        m: selectedVariables.x === 'm' || selectedVariables.y === 'm' ? null : parseFloat(document.getElementById('m').value),
        g: parseFloat(document.getElementById('g').value)
    };

   localStorage.setItem('fixedValues', JSON.stringify(currentFixedValues));

    if (violatesRAConstraintWithSliders(selectedVariables, currentFixedValues)) {
        showGraphError(`
            Invalid selection: the graph is defined only for r &gt; a.<br>
            Please choose a value of r greater than a.
        `);
        return;
    }

    plotGraph(selectedVariables, currentFixedValues);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.var-select').forEach(el => {
        el.addEventListener('change', updateGraph);
    });

    document.querySelectorAll('input[type="range"]').forEach(el => {
        // Toglie l'oninput="updateGraph()" già scritto nell'HTML.
        // Altrimenti updateGraph viene chiamata comunque mentre trascini.
        el.removeAttribute('oninput');

        // Mentre trascini, aggiorna solo il numero accanto allo slider.
        // Non ridisegna il grafico.
        el.addEventListener('input', () => {
            document.getElementById(el.id + '-value').textContent = el.value;
        });

        // Quando rilasci lo slider, ridisegna il grafico una sola volta.
        el.addEventListener('change', () => {
            updateGraph();
        });
    });

    updateGraph();
});