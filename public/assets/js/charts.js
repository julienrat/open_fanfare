(() => {
  if (typeof window.Chart === 'undefined') {
    return;
  }

  const initCharts = (root = document) => {
    const canvases = root.querySelectorAll('canvas[data-chart]');
    canvases.forEach((canvas) => {
      if (canvas.dataset.chartInit === '1') {
        if (canvas._chart && canvas.offsetParent !== null) {
          canvas._chart.resize();
        }
        return;
      }
      if (canvas.offsetParent === null) {
        return;
      }
      const raw = canvas.getAttribute('data-chart');
      if (!raw) return;
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        return;
      }

      const labels = data.map((entry) => entry.name);
      const values = data.map((entry) => entry.value || entry.count);
      const colors = data.map((entry) => entry.color || '#cbd5f0');

      const chart = new window.Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderWidth: 1,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                generateLabels: (chart) => {
                  const data = chart.data;
                  if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
                    return [];
                  }
                  const dataset = data.datasets[0];
                  return data.labels.map((label, index) => ({
                    text: `${label} (${dataset.data[index] ?? 0})`,
                    fillStyle: dataset.backgroundColor[index],
                    strokeStyle: dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: isNaN(dataset.data[index]) || chart.getDataVisibility(index) === false,
                    index,
                  }));
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
              },
            },
          },
        },
      });
      canvas.dataset.chartInit = '1';
      canvas._chart = chart;
    });
  };

  initCharts();

  document.addEventListener('modal:open', (event) => {
    if (event.detail && event.detail.modal) {
      initCharts(event.detail.modal);
    }
  });
})();
