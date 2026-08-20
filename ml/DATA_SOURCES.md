# Verdyx — ML Model Data Sources

## Dataset: Taiwanese Bankruptcy Prediction

**Canonical Source:** UCI Machine Learning Repository  
**URL:** https://archive.ics.uci.edu/dataset/572/taiwanese+bankruptcy+prediction  
**Kaggle Mirror:** `fedesoriano/company-bankruptcy-prediction` (same data)

### License
**Creative Commons Attribution 4.0 International (CC BY 4.0)**  
Sharing and adaptation permitted for any purpose (academic and commercial), provided appropriate credit is given.

### Citation
> UCI Machine Learning Repository, "Taiwanese Bankruptcy Prediction,"  
> https://archive.ics.uci.edu/dataset/572/taiwanese+bankruptcy+prediction

### Composition
- **Records:** 6,819 companies
- **Features:** 95 financial ratio variables
- **Source:** Taiwan Economic Journal, 1999–2009
- **Target:** `Bankrupt?` (1 = bankrupt, 0 = not)
- **Bankruptcy Definition:** Taiwan Stock Exchange business regulations

### Known Issues
- **Severe Class Imbalance:** Only ~3.23% of records labeled bankrupt (~220 of 6,819)
- **Mitigation:** `class_weight='balanced'` in RandomForestClassifier
- **Evaluation:** Precision, Recall, F1, and AUC — not raw accuracy

### Provenance
This is a real UCI repository dataset, cited in multiple peer-reviewed papers and used widely in bankruptcy-prediction teaching material.
