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
      const area = canvas.closest('.chart-area');

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
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
              },
            },
          },
        },
      });
      const fitLegend = () => {
        if (!area) return;
        const base = window.innerWidth < 700 ? 220 : 260;
        if (base > area.clientHeight) {
          area.style.minHeight = `${base}px`;
          area.style.height = `${base}px`;
          chart.resize();
        }
      };
      setTimeout(fitLegend, 0);

      const legendHost = canvas.closest('.chart-card')?.querySelector('.chart-legend')
        || canvas.closest('.instruments-section')?.querySelector('.chart-legend');
      if (legendHost) {
        legendHost.innerHTML = '';
        labels.forEach((label, index) => {
          const item = document.createElement('div');
          item.className = 'chart-legend-item';
          const dot = document.createElement('span');
          dot.className = 'chart-legend-dot';
          dot.style.backgroundColor = colors[index] || '#cbd5f0';
          const text = document.createElement('span');
          const value = values[index] ?? 0;
          text.textContent = `${label} (${value})`;
          item.appendChild(dot);
          item.appendChild(text);
          legendHost.appendChild(item);
        });
      }
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
