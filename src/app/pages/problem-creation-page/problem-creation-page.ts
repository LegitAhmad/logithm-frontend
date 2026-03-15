import { Component, signal, EventEmitter, Output } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { Router } from '@angular/router';

@Component({
  selector: 'app-problem-creation-page',
  imports: [Navbar, FormsModule, MarkdownModule],
  templateUrl: './problem-creation-page.html',
  styleUrl: './problem-creation-page.css',
})
export class ProblemCreationPage {

  constructor(private router: Router) { }
  markdownContent = signal('# New Problem Statement\n\nWrite your description here...');
  isPreviewMode = signal(false);

  testCasesJson = signal('[\n  {\n    "id": 1,\n    "input": "5 10",\n    "target": "15",\n    "isHidden": false\n  }\n]');
  selectedDifficulty = signal('Easy');

  // Format the JSON with 2-space indentation
  formatJson() {
    try {
      const obj = JSON.parse(this.testCasesJson());
      this.testCasesJson.set(JSON.stringify(obj, null, 2));
    } catch (e) {
      alert('Invalid JSON! Please fix errors before formatting.');
    }
  }


  verifySchema() {
  const jsonString = this.testCasesJson().trim();

  // 1. Check if empty
  if (!jsonString) {
    alert("The editor is empty. Please add some JSON.");
    return;
  }

  try {
    // 2. The Actual Check
    const parsedData = JSON.parse(jsonString);

    // 3. Check if it's an Array (as required for test cases)
    if (!Array.isArray(parsedData)) {
      alert("Format Error: Your JSON should start with '[' and end with ']'. It must be an array of objects.");
      return;
    }

    // 4. Check internal structure (Optional but recommended)
    if (parsedData.length > 0 && (!parsedData[0].input || !parsedData[0].target)) {
      alert("Schema Warning: Your objects are missing the required 'input' or 'target' fields.");
      return;
    }

    alert("Success! The JSON is perfectly formatted.");
    
  } catch (error) {
    // 5. Catch Syntax Errors (missing commas, quotes, etc.)
    console.error("JSON Error:", error);
    alert("Invalid JSON: There is a syntax error in your code. Check for missing quotes or extra commas.");
  }
}

  togglePreview() {
    this.isPreviewMode.update(val => !val);
  }

  saveProblem() {
    const finalData = {
      description: this.markdownContent(),
      testCases: JSON.parse(this.testCasesJson())
    };
    console.log('Publishing Problem to System...', finalData);
    this.router.navigate(['/assignment']);
  }

  onCancel() {
    this.router.navigate(['/assignment']);
  }
}
