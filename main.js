const SUPABASE_URL = 'https://oghprzacemymwsgpwlqa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_niXLjBAatXnM885L-Z05Hg_rI0dSzTF';

async function checkLicense() {
    let storedKey = localStorage.getItem('wcwp_license_key');
    
    if (!storedKey) {
        showLicenseModal();
        return false;
    }
    
    const isValid = await validateKeyWithAPI(storedKey);
    
    if (!isValid) {
        localStorage.removeItem('wcwp_license_key');
        showLicenseModal();
        return false;
    }
    
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
        
        if (data.length === 0) return false;
        
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
        let ipAddress = null;
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (e) {
            ipAddress = 'unavailable';
        }
        
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
                ip_address: ipAddress
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

function showDataErrorModal(errorType, details = "") {
    const modal = document.createElement('div');
    modal.id = 'dataErrorModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(11, 17, 32, 0.96); display: flex; align-items: center;
        justify-content: center; z-index: 10000; backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
                    padding: 40px; border-radius: 20px; max-width: 650px; width: 95%;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    box-shadow: 0 25px 70px rgba(0,0,0,0.6); position: relative;">
            
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="width: 50px; height: 50px; margin: 0 auto 15px; background: rgba(239, 68, 68, 0.1);
                            border-radius: 50%; display: flex; align-items: center; justify-content: center;
                            border: 2px solid var(--accent-red);">
                    <span style="font-size: 24px;">⚠️</span>
                </div>
                <h2 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Invalid Data Detected</h2>
                <p style="color: var(--text-muted); font-size: 14px; margin: 0;">${errorType}</p>
                <p style="color: var(--accent-red); font-size: 12px; font-family: 'JetBrains Mono', monospace; margin-top: 5px;">${details}</p>
            </div>

            <div style="margin-bottom: 25px;">
                <h4 style="color: var(--accent-blue); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                    Required Data Format (Example)
                </h4>
                <div class="template-preview-wrapper">
                    <table class="template-table">
                        <thead>
                            <tr>
                                <th>Salesman No</th>
                                <th>Customer Code</th>
                                <th>Name</th>
                                <th>YTD Sales $</th>
                                <th>YTD GP %</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>10</td>
                                <td>000001</td>
                                <td>Example Customer 1</td>
                                <td>50230.00</td>
                                <td>28.5</td>
                            </tr>
                            <tr>
                                <td>10</td>
                                <td>000002</td>
                                <td>Example Customer 2</td>
                                <td>12400.50</td>
                                <td>15.2</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style="color: var(--text-muted); font-size: 12px; margin-top: 10px; line-height: 1.4;">
                    <b>Make sure your data follows our expectations:</b> Check for missing headers, text inside price columns, or unreadable "NaN" values.
                </p>
            </div>
            
            <button onclick="this.closest('#dataErrorModal').remove()" 
                    style="width: 100%; background: var(--bg-row-hover); color: white; padding: 14px; 
                           border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; 
                           font-weight: 600; transition: all 0.2s;"
                    onmouseover="this.style.background='var(--accent-blue)'"
                    onmouseout="this.style.background='var(--bg-row-hover)'">
                Try Another File
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

document.getElementById('fileInput').addEventListener('change', handleFile);

let chartInstances = [];
let currentAnalysis = null;
let currentDateInfo = null;

async function handleFile(e) {
    if (!await checkLicense()) return;
    
    const file = e.target.files[0];
    if (!file) return;

    showLoading();

    const fileName = file.name;
    const dateInfo = extractDateFromFilename(fileName);
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) throw new Error("The file appears to be empty.");

            const cleanData = cleanSalesData(jsonData);
            if (cleanData.length === 0) throw new Error("No valid customer records found. Check headers.");

            const analysis = analyzeData(cleanData);
            
            setTimeout(() => {
                renderDashboard(analysis, dateInfo);
                hideLoading();
            }, 800);

        } catch (err) {
            hideLoading();
            if(err.message !== "ValidationFailed") {
                showDataErrorModal("Failed to process file.", err.message);
            }
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function extractDateFromFilename(filename) {
    console.log('Extracting date from filename:', filename);
    const match = filename.match(/(\d{1,2})[._](\d{1,2})[._](\d{2})/);
    console.log('Regex match result:', match);
    
    if (match) {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        let year = parseInt(match[3]);
        
        year = year < 50 ? 2000 + year : 1900 + year;
        
        const date = new Date(year, month - 1, day);
        
        return {
            date: date,
            formatted: date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            shortDate: `${month}/${day}/${year}`,
            periodEnd: date,
            periodStart: new Date(year, 0, 1)
        };
    }
    
    return {
        date: new Date(),
        formatted: 'Unknown Date',
        shortDate: 'N/A',
        periodEnd: new Date(),
        periodStart: new Date(new Date().getFullYear(), 0, 1)
    };
}

function cleanSalesData(data) {
    return data.map(row => {
        const cleanRow = {};
        for (let key in row) {

            if (key) cleanRow[key.trim()] = row[key];
        }
        return cleanRow;
    }).filter(row => {
        const salesmanNo = String(row['Salesman No'] || '');

        const hasCustomerCode = row['Customer Code'] !== undefined && row['Customer Code'] !== null && row['Customer Code'] !== '';
        
        return hasCustomerCode && 
               !salesmanNo.toLowerCase().includes('total') && 
               salesmanNo.toLowerCase() !== 'grand total';
    });
}

function analyzeData(data) {
    const parseNum = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[$,%]/g, '').trim();
        return parseFloat(cleaned) || 0;
    };

    const customers = data.map(row => {
        const mtdSales = parseNum(row['MTD Sales $'] || row['MTD Sales']);
        const ytdSales = parseNum(row['YTD Sales $'] || row['YTD Sales']);
        const lytdSales = parseNum(row['LYTD Sales $'] || row['LYTD Sales']);
        const mtdGP = parseNum(row['MTD GP $'] || row['MTD GP']);
        const ytdGP = parseNum(row['YTD GP $'] || row['YTD GP']);
        
        const ytdGPPercent = parseNum(row['YTD GP %'] || row['YTD GP%'] || row['GP%']);
        const mtdGPPercent = parseNum(row['MTD GP %'] || row['MTD GP%']);

        const ytdChange = lytdSales > 0 ? ((ytdSales - lytdSales) / lytdSales * 100) : 0;
        
        let status = 'flat';
        if (ytdChange > 5) status = 'growing';
        if (ytdChange < -5) status = 'declining';
        
        return {
            code: row['Customer Code'],
            name: String(row['Name'] || '').trim(),
            mtdSales,
            ytdSales,
            lytdSales,
            ytdChange,
            ytdGP,
            mtdGP,
            ytdGPPercent,
            mtdGPPercent,
            status
        };
    });

    const totals = {
        mtdSales: customers.reduce((sum, c) => sum + c.mtdSales, 0),
        ytdSales: customers.reduce((sum, c) => sum + c.ytdSales, 0),
        lytdSales: customers.reduce((sum, c) => sum + c.lytdSales, 0),
        mtdGP: customers.reduce((sum, c) => sum + c.mtdGP, 0),
        ytdGP: customers.reduce((sum, c) => sum + c.ytdGP, 0)
    };

    totals.ytdChange = totals.lytdSales > 0 
        ? ((totals.ytdSales - totals.lytdSales) / totals.lytdSales * 100) 
        : (totals.ytdSales > 0 ? 100 : 0);
    
    totals.ytdGPPercent = totals.ytdSales > 0 ? (totals.ytdGP / totals.ytdSales * 100) : 0;

    if (totals.ytdSales === 0) {
        showDataErrorModal("Data Error", "No sales records could be read.");
        throw new Error("ValidationFailed");
    }

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

function renderCustomerRows(data, applyLimit) {
    const tbody = document.querySelector('#top-customers-table tbody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">No results found</td></tr>';
        return;
    }

    const html = data.map((c, i) => {
        const isHidden = applyLimit && i >= 10;
        
        return `
            <tr class="${isHidden ? 'hidden-row' : ''}">
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
        `;
    }).join('');

    tbody.innerHTML = html;
}

function downloadReport() {
    if (!currentAnalysis) {
        alert('No data to export. Please upload a file first.');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // --- Sheet 1: Summary ---
    const summaryData = [
        ['BigWeld Sales Analysis Report'],
        ['Report Date:', currentDateInfo.formatted],
        ['Period:', `${currentDateInfo.periodStart.toLocaleDateString('en-US')} - ${currentDateInfo.periodEnd.toLocaleDateString('en-US')}`],
        [],
        ['PERFORMANCE SUMMARY'],
        ['Metric', 'Value'],
        ['YTD Sales', `$${currentAnalysis.totals.ytdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
        ['vs Last Year', `${currentAnalysis.totals.ytdChange >= 0 ? '+' : ''}${currentAnalysis.totals.ytdChange.toFixed(1)}%`],
        ['YTD GP%', `${currentAnalysis.totals.ytdGPPercent.toFixed(1)}%`],
        ['MTD Sales', `$${currentAnalysis.totals.mtdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
        [],
        ['ACCOUNT HEALTH'],
        ['Growing Accounts', currentAnalysis.customers.filter(c => c.status === 'growing').length],
        ['Flat Accounts', currentAnalysis.customers.filter(c => c.status === 'flat').length],
        ['Declining Accounts', currentAnalysis.customers.filter(c => c.status === 'declining').length]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // --- Sheet 2: All Customers ---
    const allCustomersData = currentAnalysis.topCustomers.map((c, i) => ({
        'Rank': i + 1,
        'Customer': c.name,
        'YTD Sales': c.ytdSales,
        'vs LY %': c.ytdChange,
        'GP %': c.ytdGPPercent,
        'Status': c.status.toUpperCase()
    }));
    const allCustomersSheet = XLSX.utils.json_to_sheet(allCustomersData);
    
    // Column widths: Rank, Customer, Sales, Change, GP, Status
    allCustomersSheet['!cols'] = [
        { wch: 6 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, allCustomersSheet, 'All Customers');
    
    const actionCols = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];

    // Sheet 3: Declining Accounts
    if (currentAnalysis.declining.length > 0) {
        const decliningData = currentAnalysis.declining.map(c => ({
            'Customer': c.name,
            'YTD Sales': c.ytdSales,
            'Change vs LY %': c.ytdChange
        }));
        const decliningSheet = XLSX.utils.json_to_sheet(decliningData);
        decliningSheet['!cols'] = actionCols;
        XLSX.utils.book_append_sheet(wb, decliningSheet, 'Declining Accounts');
    }
    
    // Sheet 4: No Sales This Month
    if (currentAnalysis.noMTDSales.length > 0) {
        const noMTDData = currentAnalysis.noMTDSales.map(c => ({
            'Customer': c.name,
            'YTD Sales': c.ytdSales,
            'LY MTD': c.lytdSales
        }));
        const noMTDSheet = XLSX.utils.json_to_sheet(noMTDData);
        noMTDSheet['!cols'] = actionCols;
        XLSX.utils.book_append_sheet(wb, noMTDSheet, 'No Sales This Month');
    }
    
    // Sheet 5: Low Margin Opportunities
    if (currentAnalysis.lowMargin.length > 0) {
        const lowMarginData = currentAnalysis.lowMargin.map(c => ({
            'Customer': c.name,
            'YTD Sales': c.ytdSales,
            'GP %': c.ytdGPPercent
        }));
        const lowMarginSheet = XLSX.utils.json_to_sheet(lowMarginData);
        lowMarginSheet['!cols'] = actionCols;
        XLSX.utils.book_append_sheet(wb, lowMarginSheet, 'Low Margin');
    }
    
    const fileName = `BigWeld_Report_${currentDateInfo.shortDate.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function renderDashboard(analysis, dateInfo) {
    const output = document.getElementById('output');

    currentAnalysis = analysis;
    currentDateInfo = dateInfo;
    
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
    
    const statusColor = analysis.totals.ytdChange >= 0 ? '#4caf50' : '#f44336';
    
    output.innerHTML = `
        <div class="dashboard">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
                            padding: 10px 20px; border-radius: 8px; display: inline-block;">
                    <span style="color: #94a3b8; font-size: 0.85rem; margin-right: 10px;">📅 Report Period:</span>
                    <span style="color: #3b82f6; font-weight: 600;">
                        ${dateInfo.periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                        ${dateInfo.formatted}
                    </span>
                </div>
                
                <button onclick="downloadReport()" 
                        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                               color: white; padding: 12px 24px; border: none; border-radius: 8px; 
                               cursor: pointer; font-weight: 600; font-size: 14px;
                               box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
                               transition: all 0.3s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.5)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(16, 185, 129, 0.4)';">
                    📊 Export to Excel
                </button>
            </div>

            <div class="section">
                <h2>Performance Summary</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <span tabindex="0" class="info-icon" data-tooltip="Sum of all customers' Year-to-Date Sales (YTD Sales column).">i</span>
                        <div class="stat-label">YTD Sales</div>
                        <div class="stat-value">$${analysis.totals.ytdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div class="stat-box">
                        <span tabindex="0" class="info-icon" data-tooltip="Percent change vs LY = if LY>0 then ((YTD - LY)/LY)×100; if LY=0 then 100% when YTD>0, else 0%.">i</span>
                        <div class="stat-label">vs Last Year</div>
                        <div class="stat-value" style="color: ${statusColor}">
                            ${analysis.totals.ytdChange >= 0 ? '+' : ''}${analysis.totals.ytdChange.toFixed(1)}%
                        </div>
                    </div>
                    <div class="stat-box">
                        <span tabindex="0" class="info-icon" data-tooltip="Gross Profit % = (YTD Gross Profit / YTD Sales) × 100. Shows 0 if YTD Sales is 0.">i</span>
                        <div class="stat-label">YTD GP%</div>
                        <div class="stat-value">${analysis.totals.ytdGPPercent.toFixed(1)}%</div>
                    </div>
                    <div class="stat-box">
                        <span tabindex="0" class="info-icon" data-tooltip="Sum of Month-to-Date Sales for the current period (MTD Sales column).">i</span>
                        <div class="stat-label">MTD Sales</div>
                        <div class="stat-value">$${analysis.totals.mtdSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Visual Analytics</h2>
                <div class="charts-grid">
                    <div class="chart-container">
                        <canvas id="topCustomersChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                    <div class="chart-container chart-center">
                        <span class="chart-container-title">Overall Account Health</span>
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
                <div class="charts-grid-full">
                    <div class="chart-container">
                        <canvas id="topGPChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="bottomGPChart"></canvas>
                    </div>
                </div>
            </div>

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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">All Customers (High to Low)</h2>
                    <div class="search-wrapper" style="margin: 0;">
                        <input type="text" 
                            class="search-input" 
                            placeholder="Search customer name..." 
                            onkeyup="filterTable(this)">
                    </div>
                </div>
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

    // 4. Top 10 Margin Performance (Line Chart)
    const topGPCtx = document.getElementById('topGPChart');
    if (topGPCtx) {
        const topTenData = analysis.topCustomers.slice(0, 10);

        chartInstances.push(new Chart(topGPCtx, {
            type: 'line',
            data: {
                labels: topTenData.map(c => c.name.substring(0, 12)),
                datasets: [{
                    label: 'Top 10 GP %',
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
                    title: { display: true, text: 'Top 10 - Gross Profit %', align: 'start', color: '#f1f5f9', font: {size: 16} }
                },
                scales: {
                    y: { ...commonOptions.scales.y, beginAtZero: true }
                }
            }
        }));
    }

    // 5. Lowest 10 Margin Performance (Line Chart)
    const bottomGPCtx = document.getElementById('bottomGPChart');
    if (bottomGPCtx) {
        const lowestTenData = [...analysis.customers].sort((a, b) => a.ytdGPPercent - b.ytdGPPercent).slice(0, 10);

        chartInstances.push(new Chart(bottomGPCtx, {
            type: 'line',
            data: {
                labels: lowestTenData.map(c => c.name.substring(0, 12)),
                datasets: [{
                    label: 'Lowest 10 GP %',
                    data: lowestTenData.map(c => c.ytdGPPercent),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#ef4444',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: { display: true, text: 'Lowest 10 - Gross Profit %', align: 'start', color: '#f1f5f9', font: {size: 16} }
                },
                scales: {
                    y: { ...commonOptions.scales.y, beginAtZero: true }
                }
            }
        }));
    }

    // 6. Account Health (Doughnut Chart) - NO built-in title, using custom HTML title
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
                cutout: '70%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#f1f5f9', usePointStyle: true } },
                    title: { display: false }  // DISABLED - using custom HTML title instead
                }
            }
        }));
    }
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

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function filterTable(input) {
    const filter = input.value.trim().toUpperCase();
    const table = document.getElementById("top-customers-table");
    const tr = table.getElementsByTagName("tr");
    const btn = table.nextElementSibling;

    if (btn && btn.classList.contains('show-more-btn')) {
        btn.style.display = filter.length > 0 ? "none" : "block";
    }

    for (let i = 1; i < tr.length; i++) {
        const tdName = tr[i].getElementsByTagName("td")[1];
        
        if (tdName) {
            const nameText = (tdName.textContent || tdName.innerText).toUpperCase();
            const matches = nameText.includes(filter);

            if (filter.length > 0) {
                tr[i].style.display = matches ? "table-row" : "none";
            } else {
                const isLimitRow = tr[i].classList.contains('hidden-row');
                const isExpanded = btn && btn.innerText === 'Show Less';
                
                if (isLimitRow && !isExpanded) {
                    tr[i].style.display = "none";
                } else {
                    tr[i].style.display = "";
                }
            }
        }
    }
}

function handleSearch(e) {
    const term = e.target.value.trim().toLowerCase();
    const btn = document.querySelector('#top-customers-table + .show-more-btn');

    if (!term) {
        renderCustomerRows(currentAnalysis.topCustomers, true);
        if (btn) { btn.style.display = 'block'; btn.innerText = 'Show All'; }
        return;
    }

    const filtered = currentAnalysis.topCustomers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.code.toString().includes(term)
    );

    renderCustomerRows(filtered, false);
    if (btn) btn.style.display = 'none';
}

function toggleRows(btn) {
    const table = btn.parentElement.querySelector('table');
    const rows = table.querySelectorAll('tr');
    const isExpanding = btn.innerText === 'Show All';

    for (let i = 11; i < rows.length; i++) {
        rows[i].style.display = isExpanding ? 'table-row' : 'none';
    }

    btn.innerText = isExpanding ? 'Show Less' : 'Show All';
}

function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loadingOverlay';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Analyzing Sales Data...</div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.remove();
}