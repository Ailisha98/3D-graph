function f(r, a, n, m) {
    return r * (Math.pow(r, n) * m / (Math.pow(r, n) * m + Math.pow(a, n) * (1 - m))) + 
           a * (1 - (Math.pow(r, n) * m / (Math.pow(r, n) * m + Math.pow(a, n) * (1 - m))));
}

function generateData(n, g, m) {
    let r_values = [];
    let a_values = [];
    let z_values = [];

    for (let i = 0.0001; i <= 1; i += 0.02) {
        for (let j = 0.0001; j <= 1; j += 0.02) {
            r_values.push(i);
            a_values.push(j);
            z_values.push(f(i, j, n, m));
        }
    }

    return { r_values, a_values, z_values, g };
}

function plotGraph(n, g, m) {
    let data = generateData(n, g, m);

    let surfacePlot = {
        x: data.r_values,
        y: data.a_values,
        z: data.z_values,
        mode: 'markers',
        marker: {
            size: 3,
            color: data.z_values,
            colorscale: 'Viridis',
        },
        type: 'scatter3d'
    };

    let thresholdPlane = {
        x: data.r_values,
        y: data.a_values,
        z: Array(data.r_values.length).fill(g),
        mode: 'markers',
        marker: {
            size: 2,
            color: 'gray',
            opacity: 0.6,
        },
        type: 'scatter3d'
    };

    let layout = {
        scene: {
            xaxis: { title: 'r' },
            yaxis: { title: 'a' },
            zaxis: { title: 't(r, a)' }
        },
        margin: { t: 10 } // Riduce il margine superiore per guadagnare spazio
    };
    

    Plotly.newPlot('grafico', [surfacePlot, thresholdPlane], layout);
}

function updateGraph() {
    let n = parseFloat(document.getElementById('n').value);
    let g = parseFloat(document.getElementById('g').value);
    let m = parseFloat(document.getElementById('m').value);

    document.getElementById('n-value').textContent = n;
    document.getElementById('g-value').textContent = g;
    document.getElementById('m-value').textContent = m;

    plotGraph(n, g, m);
}

// Avvia il grafico con i parametri iniziali
document.addEventListener("DOMContentLoaded", () => {
    updateGraph();
});

function resizeGraph() {
    setTimeout(() => {
        Plotly.relayout('grafico', {
            width: window.innerWidth * 0.9,
            height: window.innerHeight * 0.7
        });
    }, 200);
}
