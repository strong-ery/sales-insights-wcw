// ============ SUPABASE CONFIG ============
const SUPABASE_URL = 'https://oghprzacemymwsgpwlqa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_niXLjBAatXnM885L-Z05Hg_rI0dSzTF';

// ============ LICENSE SYSTEM WITH API ============
async function checkLicense() {
    let storedKey = localStorage.getItem('wcwp_license_key');
    
    if (!storedKey) {
        showLicenseModal();
        return false;
    }
    
    // Validate key with Supabase
    const isValid = await validateKeyWithAPI(storedKey);
    
    if (!isValid) {
        localStorage.removeItem('wcwp_license_key');
        showLicenseModal();
        return false;
    }
    
    // Log successful usage
    await logUsage(storedKey, 'file_upload');
    
    return true;
}

async function validateKeyWithAPI(key) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/licenses?license_key=eq.${key}&is_active=eq.true`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        const data = await response.json();
        
        // Check if key exists and is active
        if (data.length === 0) return false;
        
        // Check if expired
        const license = data[0];
        if (license.expires_at) {
            const expiryDate = new Date(license.expires_at);
            if (expiryDate < new Date()) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('License validation error:', error);
        return false;
    }
}

async function logUsage(key, action) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/usage_logs`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                license_key: key,
                action: action,
                user_agent: navigator.userAgent,
                // IP will be logged server-side
            })
        });
    } catch (error) {
        console.error('Usage logging error:', error);
    }
}

async function validateLicense() {
    const input = document.getElementById('licenseInput').value.trim();
    
    const isValid = await validateKeyWithAPI(input);
    
    if (isValid) {
        localStorage.setItem('wcwp_license_key', input);
        await logUsage(input, 'license_activated');
        location.reload();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
}

function showLicenseModal() {
    const modal = document.createElement('div');
    modal.id = 'licenseModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(11, 17, 32, 0.95); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(8px);
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
                    padding: 50px; border-radius: 16px; max-width: 480px; width: 90%;
                    text-align: center; border: 1px solid rgba(59, 130, 246, 0.3);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            
            <div style="width: 60px; height: 60px; margin: 0 auto 25px; background: rgba(59, 130, 246, 0.1);
                        border-radius: 50%; display: flex; align-items: center; justify-content: center;
                        border: 2px solid var(--accent-blue);">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            
            <h2 style="color: #f1f5f9; margin-bottom: 12px; font-size: 28px; font-weight: 700;">
                License Required
            </h2>
            <p style="color: #94a3b8; margin-bottom: 35px; font-size: 15px; line-height: 1.6;">
                This tool requires a valid license key.<br>
                Contact <span style="color: #3b82f6; font-weight: 600;">Dylan Strong</span> for access.
            </p>
            
            <input type="text" id="licenseInput" placeholder="Enter your license key" 
                   style="width: 100%; padding: 16px 20px; margin-bottom: 20px; 
                          background: rgba(15, 23, 42, 0.8);
                          border: 2px solid #334155; border-radius: 10px; color: #f1f5f9;
                          font-size: 15px; font-family: 'JetBrains Mono', monospace;
                          transition: all 0.3s; box-sizing: border-box;"
                   onfocus="this.style.borderColor='#3b82f6'; this.style.background='rgba(15, 23, 42, 1)';"
                   onblur="this.style.borderColor='#334155'; this.style.background='rgba(15, 23, 42, 0.8)';">
            
            <button onclick="validateLicense()" 
                    style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                           color: white; padding: 16px 30px; border: none; border-radius: 10px; 
                           cursor: pointer; font-weight: 600; font-size: 16px; 
                           transition: all 0.3s; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.5)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(59, 130, 246, 0.4)';">
                Activate License
            </button>
            
            <p id="errorMsg" style="color: #ef4444; margin-top: 20px; display: none; 
                                     font-size: 14px; font-weight: 500; padding: 12px;
                                     background: rgba(239, 68, 68, 0.1); border-radius: 8px;
                                     border: 1px solid rgba(239, 68, 68, 0.3);">
                ❌ Invalid license key. Please check and try again.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        const input = document.getElementById('licenseInput');
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validateLicense();
        });
    }, 100);
}

document.getElementById('fileInput').addEventListener('change', handleFile);

let chartInstances = [];

async function handleFile(e) {
    // CHECK LICENSE FIRST
    const isLicensed = await checkLicense();
    if (!isLicensed) {
        return;
    }
    
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

function showPrivacyInfo() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(11, 17, 32, 0.95); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(8px);
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
                    padding: 40px; border-radius: 16px; max-width: 550px; width: 90%;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            
            <div style="width: 60px; height: 60px; margin: 0 auto 25px; background: rgba(16, 185, 129, 0.1);
                        border-radius: 50%; display: flex; align-items: center; justify-content: center;
                        border: 2px solid #10b981;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                </svg>
            </div>
            
            <h2 style="color: #f1f5f9; margin-bottom: 20px; font-size: 24px; font-weight: 700; text-align: center;">
                Your Data is Secure
            </h2>
            
            <div style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin-bottom: 25px;">
                <p style="margin-bottom: 15px;">
                    <strong style="color: #10b981;">✓ Zero Data Storage:</strong> 
                    Your Excel files are processed entirely in your browser. No data is ever uploaded to our servers.
                </p>
                <p style="margin-bottom: 15px;">
                    <strong style="color: #10b981;">✓ Client-Side Processing:</strong> 
                    All analysis happens locally on your device. Your sensitive sales data never leaves your computer.
                </p>
                <p style="margin-bottom: 15px;">
                    <strong style="color: #10b981;">✓ Minimal Tracking:</strong> 
                    We only log license validation and anonymous usage statistics (timestamp, license key). No personal or business data is collected.
                </p>
                <p style="margin-bottom: 0;">
                    <strong style="color: #10b981;">✓ Secure Connection:</strong> 
                    All communications are encrypted via HTTPS. Your license validation is protected end-to-end.
                </p>
            </div>
            
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                           color: white; padding: 14px 30px; border: none; border-radius: 10px; 
                           cursor: pointer; font-weight: 600; font-size: 15px; 
                           transition: all 0.3s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.5)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(16, 185, 129, 0.4)';">
                Got it, thanks!
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}