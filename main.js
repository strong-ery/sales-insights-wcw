document.getElementById('fileInput').addEventListener('change', handleFile);

let chartInstances = [];

function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const cleanData = cleanSalesData(jsonData);
        const analysis = analyzeData(cleanData);
        
        renderDashboard(analysis);
    };
    
    reader.readAsArrayBuffer(file);
}

function cleanSalesData(data) {
    return data.filter(row => {
        return row['Customer Code'] && 
               !String(row['Salesman No']).includes('Total') &&
               row['Salesman No'] !== 'Grand Total';
    });
}

function analyzeData(data) {
    const totals = {
        mtdSales: data.reduce((sum, row) => sum + (row[' MTD Sales $ '] || 0), 0),
        ytdSales: data.reduce((sum, row) => sum + (row[' YTD Sales $ '] || 0), 0),
        lytdSales: data.reduce((sum, row) => sum + (row[' LYTD Sales $ '] || 0), 0),
        mtdGP: data.reduce((sum, row) => sum + (row[' MTD GP $ '] || 0), 0),
        ytdGP: data.reduce((sum, row) => sum + (row[' YTD GP $ '] || 0), 0)
    };
    
    totals.ytdChange = ((totals.ytdSales - totals.lytdSales) / totals.lytdSales * 100);
    totals.ytdGPPercent = (totals.ytdGP / totals.ytdSales * 100);
    
    const customers = data.map(row => {
        const ytdSales = row[' YTD Sales $ '] || 0;
        const lytdSales = row[' LYTD Sales $ '] || 0;
        const mtdSales = row[' MTD Sales $ '] || 0;
        const ytdChange = lytdSales > 0 ? ((ytdSales - lytdSales) / lytdSales * 100) : 0;
        
        let status = 'flat';
        if (ytdChange > 5) status = 'growing';
        if (ytdChange < -5) status = 'declining';
        
        return {
            code: row['Customer Code'],
            name: (row['Name'] || '').trim(),
            mtdSales: parseFloat(row[' MTD Sales $ ']) || 0,
            ytdSales: parseFloat(row[' YTD Sales $ ']) || 0,
            lytdSales: parseFloat(row[' LYTD Sales $ ']) || 0,
            ytdChange: ytdChange,
            ytdGP: parseFloat(row[' YTD GP $ ']) || 0,
            // Force these to numbers immediately
            ytdGPPercent: parseFloat(row['YTD GP %']) || 0,
            mtdGPPercent: parseFloat(row['MTD GP%']) || 0,
            status: status
        };
    });
    
    const topCustomers = [...customers].sort((a, b) => b.ytdSales - a.ytdSales);
    const declining = customers.filter(c => c.status === 'declining').sort((a, b) => a.ytdChange - b.ytdChange);
    const noMTDSales = customers.filter(c => c.mtdSales === 0 && c.lytdSales > 0).sort((a, b) => b.lytdSales - a.lytdSales);
    const lowMargin = customers.filter(c => c.ytdSales > 10000 && c.ytdGPPercent < 25).sort((a, b) => a.ytdGPPercent - b.ytdGPPercent);
    
    return {
        totals,
        customers,
        topCustomers,
        declining,
        noMTDSales,
        lowMargin
    };
}

function renderDashboard(analysis) {
    const output = document.getElementById('output');
    
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
    
    const statusColor = analysis.totals.ytdChange >= 0 ? '#4caf50' : '#f44336';
    
    output.innerHTML = `
        <div class="dashboard">
            <!-- Performance Summary -->
            <div class="section">
                <h2>Performance Summary</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">YTD Sales</div>
                        <div class="stat-value">$${analysis.totals.ytdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">vs Last Year</div>
                        <div class="stat-value" style="color: ${statusColor}">
                            ${analysis.totals.ytdChange >= 0 ? '+' : ''}${analysis.totals.ytdChange.toFixed(1)}%
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">YTD GP%</div>
                        <div class="stat-value">${analysis.totals.ytdGPPercent.toFixed(1)}%</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">MTD Sales</div>
                        <div class="stat-value">$${analysis.totals.mtdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="section">
                <h2>Visual Analytics</h2>
                <div class="charts-grid">
                    <div class="chart-container">
                        <canvas id="topCustomersChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="marginChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Priority Actions -->
            <div class="section">
                <h2>⚠️ Priority Actions</h2>
                
                <h3>Declining Accounts (${analysis.declining.length})</h3>
                <div class="table-wrapper">
                    <table id="declining-table">
                        <thead>
                            <tr><th>Customer</th><th>YTD Sales</th><th>Change vs LY</th></tr>
                        </thead>
                        <tbody>
                            ${analysis.declining.map((c, i) => `
                                <tr class="${i >= 5 ? 'hidden-row' : ''}">
                                    <td>${c.name}</td>
                                    <td>$${c.ytdSales.toLocaleString()}</td>
                                    <td class="negative">${c.ytdChange.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${analysis.declining.length > 5 ? `<button class="show-more-btn" onclick="toggleRows(this)">Show All</button>` : ''}
                </div>

                <h3>No Sales This Month (${analysis.noMTDSales.length})</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Customer</th><th>YTD Sales</th><th>LY MTD</th></tr>
                        </thead>
                        <tbody>
                            ${analysis.noMTDSales.map((c, i) => `
                                <tr class="${i >= 5 ? 'hidden-row' : ''}">
                                    <td>${c.name}</td>
                                    <td>$${c.ytdSales.toLocaleString()}</td>
                                    <td>$${c.lytdSales.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${analysis.noMTDSales.length > 5 ? `<button class="show-more-btn" onclick="toggleRows(this)">Show All</button>` : ''}
                </div>

                <h3>Low Margin Opportunities (${analysis.lowMargin.length})</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Customer</th><th>YTD Sales</th><th>GP%</th></tr>
                        </thead>
                        <tbody>
                            ${analysis.lowMargin.map((c, i) => `
                                <tr class="${i >= 5 ? 'hidden-row' : ''}">
                                    <td>${c.name}</td>
                                    <td>$${c.ytdSales.toLocaleString()}</td>
                                    <td>${c.ytdGPPercent.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${analysis.lowMargin.length > 5 ? `<button class="show-more-btn" onclick="toggleRows(this)">Show All</button>` : ''}
                </div>
            </div>

            <div class="section">
                <h2>All Customers (High to Low)</h2>
                <div class="table-wrapper">
                    <table id="top-customers-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Customer</th>
                                <th>YTD Sales</th>
                                <th>vs LY</th>
                                <th>GP%</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analysis.topCustomers.map((c, i) => `
                                <tr class="${i >= 10 ? 'hidden-row' : ''}">
                                    <td>${i + 1}</td>
                                    <td>${c.name}</td>
                                    <td>$${c.ytdSales.toLocaleString()}</td>
                                    <td class="${c.ytdChange >= 0 ? 'positive' : 'negative'}">
                                        ${c.ytdChange >= 0 ? '+' : ''}${c.ytdChange.toFixed(1)}%
                                    </td>
                                    <td>${c.ytdGPPercent.toFixed(1)}%</td>
                                    <td>
                                        <span class="status-pill status-${c.status}">
                                            ${c.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${analysis.topCustomers.length > 10 ? `<button class="show-more-btn" onclick="toggleRows(this)">Show All</button>` : ''}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        renderCharts(analysis);
    }, 100);
}

function renderCharts(analysis) {
    // 1. Global Chart Configuration
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.borderColor = '#334155';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#f1f5f9', padding: 20, usePointStyle: true }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' },
                border: { display: false }
            }
        }
    };

    // 2. Top 10 Revenue Drivers (Bar Chart)
    const topCtx = document.getElementById('topCustomersChart');
    if (topCtx) {
        // We slice to 10 here so the chart doesn't get crowded
        const topTenData = analysis.topCustomers.slice(0, 10);
        
        chartInstances.push(new Chart(topCtx, {
            type: 'bar',
            data: {
                labels: topTenData.map(c => c.name.substring(0, 15)),
                datasets: [{
                    label: 'YTD Sales',
                    data: topTenData.map(c => c.ytdSales),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    barPercentage: 0.7
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: { display: true, text: 'Top 10 Revenue Drivers', align: 'start', color: '#f1f5f9', font: {size: 16} }
                }
            }
        }));
    }

    // 3. Year over Year Comparison (Grouped Bar Chart)
    const perfCtx = document.getElementById('performanceChart');
    if (perfCtx) {
        chartInstances.push(new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: ['Total Revenue', 'Gross Profit'],
                datasets: [
                    {
                        label: 'This Year',
                        data: [analysis.totals.ytdSales, analysis.totals.ytdGP],
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    },
                    {
                        label: 'Last Year',
                        // Note: LY GP is estimated based on current GP% if not explicitly in data
                        data: [analysis.totals.lytdSales, analysis.totals.lytdSales * (analysis.totals.ytdGPPercent / 100)],
                        backgroundColor: '#334155',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: { display: true, text: 'Year over Year Comparison', align: 'start', color: '#f1f5f9', font: {size: 16} }
                }
            }
        }));
    }

    // 4. Margin Efficiency (Line Chart)
    const marginCtx = document.getElementById('marginChart');
    if (marginCtx) {
        // Again, slicing to 10 to keep the line chart readable
        const topTenData = analysis.topCustomers.slice(0, 10);

        chartInstances.push(new Chart(marginCtx, {
            type: 'line',
            data: {
                labels: topTenData.map(c => c.name.substring(0, 10)),
                datasets: [{
                    label: 'GP %',
                    data: topTenData.map(c => c.ytdGPPercent),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: { display: true, text: 'Margin Efficiency (Top 10)', align: 'start', color: '#f1f5f9', font: {size: 16} }
                },
                scales: {
                    y: { ...commonOptions.scales.y, beginAtZero: true }
                }
            }
        }));
    }

    // 5. Account Health (Doughnut Chart)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        const statusCounts = {
            growing: analysis.customers.filter(c => c.status === 'growing').length,
            flat: analysis.customers.filter(c => c.status === 'flat').length,
            declining: analysis.customers.filter(c => c.status === 'declining').length
        };
        
        chartInstances.push(new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Growing', 'Flat', 'Declining'],
                datasets: [{
                    data: [statusCounts.growing, statusCounts.flat, statusCounts.declining],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderColor: '#1e293b',
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                cutout: '70%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#f1f5f9', usePointStyle: true } },
                    title: { display: true, text: 'Overall Account Health', align: 'start', color: '#f1f5f9', font: {size: 16} }
                }
            }
        }));
    }
}

function toggleRows(btn) {
    const table = btn.parentElement.querySelector('table');
    const hiddenRows = table.querySelectorAll('.hidden-row');
    const isExpanded = btn.innerText === 'Show Less';

    hiddenRows.forEach(row => {
        row.style.display = isExpanded ? 'none' : 'table-row';
    });

    btn.innerText = isExpanded ? 'Show All' : 'Show Less';
}