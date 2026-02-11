import pandas as pd
import random

company_types = [
    "Manufacturing", "Industrial Supply", "Fabrication", "Steel Works", 
    "Welding Co", "Equipment Inc", "Industries", "Metals", "Fabricators",
    "Machine Shop", "Tool & Die", "Metal Works", "Supply Co", "Engineering",
    "Precision Parts", "Assembly", "Components", "Distribution", "Systems"
]

company_prefixes = [
    "Apex", "Titan", "Summit", "Pacific", "Northern", "Cascade", "Redwood",
    "Meridian", "Horizon", "Valley", "Pinnacle", "Sterling", "Elite", "Premier",
    "Delta", "Omega", "Atlas", "Phoenix", "Vertex", "Zenith", "Crown", "Eagle",
    "Falcon", "Granite", "Harbor", "Iron", "Liberty", "Mountain", "Noble",
    "Olympus", "Pioneer", "Quest", "Royal", "Silverline", "Thunder", "United",
    "Victory", "Western", "Ace", "Blue Ridge", "Continental", "Frontier",
    "Gateway", "Hillside", "Interstate", "Keystone", "Lakeside", "Metro",
    "Nationwide", "Oceanic"
]

customers = []
for i in range(1, 51):
    name = f"{random.choice(company_prefixes)} {random.choice(company_types)}"
    
    # Start with THIS year's sales
    ytd = random.randint(50000, 300000)
    
    rand = random.random()
    
    if rand < 0.15:  # 15% declining accounts
        lytd = int(ytd / random.uniform(0.70, 0.94))
        mtd = random.randint(0, int(ytd * 0.12))
        ytd_gp_pct = random.uniform(25, 38)
        lytd_gp_pct = random.uniform(25, 38)
    elif rand < 0.30:  # 15% no MTD sales
        lytd = int(ytd / random.uniform(0.85, 1.15))
        mtd = 0
        ytd_gp_pct = random.uniform(25, 38)
        lytd_gp_pct = random.uniform(25, 38)
    elif rand < 0.40:  # 10% low margin opportunities
        ytd = random.randint(100000, 250000)
        lytd = int(ytd / random.uniform(0.90, 1.10))
        mtd = random.randint(8000, 25000)
        ytd_gp_pct = random.uniform(15.0, 24.9)  # Low margin
        lytd_gp_pct = random.uniform(15.0, 24.9)
    else:  # Growing or flat accounts
        lytd = int(ytd / random.uniform(0.95, 1.35))
        mtd = random.randint(int(ytd * 0.08), int(ytd * 0.15))
        ytd_gp_pct = random.gauss(31, 5)
        ytd_gp_pct = max(18, min(42, ytd_gp_pct))
        lytd_gp_pct = random.gauss(31, 5)
        lytd_gp_pct = max(18, min(42, lytd_gp_pct))
    
    # Calculate GP$ from sales * GP%
    ytd_gp = ytd * (ytd_gp_pct / 100)
    lytd_gp = lytd * (lytd_gp_pct / 100)
    mtd_gp = mtd * (ytd_gp_pct / 100)
    
    # MTD GP% same as YTD GP%
    mtd_gp_pct = ytd_gp_pct
    
    customers.append({
        'Salesman No': 10,
        'Customer Code': f'C{i:05d}',
        'Name': name,
        'YTD Sales $': ytd,
        'LYTD Sales $': lytd,
        'MTD Sales $': mtd,
        'YTD GP $': round(ytd_gp, 2),
        'LYTD GP $': round(lytd_gp, 2),
        'MTD GP $': round(mtd_gp, 2),
        'YTD GP %': round(ytd_gp_pct, 1),
        'LYTD GP %': round(lytd_gp_pct, 1),
        'MTD GP %': round(mtd_gp_pct, 1)
    })

df = pd.DataFrame(customers)
df = df.sort_values('YTD Sales $', ascending=False).reset_index(drop=True)
df.to_excel('Sales_Demo_12_31_25.xlsx', index=False, sheet_name='Sheet1')

print(f"Generated {len(df)} customers")
print(f"Total YTD Sales: ${df['YTD Sales $'].sum():,.0f}")
print(f"Total LYTD Sales: ${df['LYTD Sales $'].sum():,.0f}")
print(f"Total YTD GP: ${df['YTD GP $'].sum():,.0f}")
print(f"Total LYTD GP: ${df['LYTD GP $'].sum():,.0f}")
print(f"Overall YoY Change: {((df['YTD Sales $'].sum() - df['LYTD Sales $'].sum()) / df['LYTD Sales $'].sum() * 100):.1f}%")
print(f"Overall YTD GP%: {(df['YTD GP $'].sum() / df['YTD Sales $'].sum() * 100):.1f}%")
print(f"Declining accounts: {len(df[((df['YTD Sales $'] - df['LYTD Sales $']) / df['LYTD Sales $']) < -0.05])}")
print(f"No MTD sales: {len(df[df['MTD Sales $'] == 0])}")
print(f"Low margin (>$100k, <25% GP): {len(df[(df['YTD Sales $'] > 100000) & (df['YTD GP %'] < 25)])}")
print("\nFile saved as: Sales_Demo_12_31_25.xlsx")