export const WELCOME_MESSAGE = `
## Welcome to Stata Assistant (Econ students Only)!

I'm your AI partner for streamlined econometric analysis.

**How to get started:**

1.  **Upload Data:** Use the "Upload .dta File(s)" button in the Workspace to load your dataset.
2.  **Add Your Script:** Upload your .do file or write/paste your Stata code directly into the editor.
3.  **Debug & Analyze:** Use the action buttons to debug your code, run analyses, or ask me questions about your data.

Ready to supercharge your research?
`;

export const INITIAL_CODE = `* This is a sample script.
* You can upload your own .do file or edit this one directly.

* Load the data (assuming you've uploaded it in the workspace)
* Note: The AI assistant is aware of your uploaded datasets.
use "your_dataset_name.dta", clear

* Summarize key variables
summarize price mpg weight

* Run a simple regression
regress price mpg weight
`;