// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { CSharpField, CSharpMethod, CSharpNamespace, FileParser } from '@fluffy-spoon/csharp-parser';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {

		// Get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('There is no active text editor');
			return;
		}

		let document = editor.document;
		let text = document.getText();
		vscode.window.showInformationMessage('The length of the text in the document is: ' + text.length);

		var parser = new FileParser(text);
		var result = parser.parseFile();
		var selectedToken = getSelectedWord(editor);

		// check if selected member has a value
		if (!selectedToken) {
			return;
		}

		// for every class
		// check innerScope if selection is present
		// check field names, method names
		// if multiple found, regex whole file and compare line numbers with current position
		const candidateFields: CSharpField[] = [];
		const candidateMethods: CSharpMethod[] = [];
		result.getAllClassesRecursively().forEach(c => {
			if (!c.innerScopeText.includes(selectedToken)) {
				return;
			}
			c.fields.forEach(f => {
				if (f.name === selectedToken) {
					candidateFields.push(f);
				}
			});
			c.methods.forEach(m => {
				if (m.name === selectedToken) {
					candidateMethods.push(m);
				}
			});
		});

		let candidate: CSharpField | CSharpMethod;
		if (candidateFields.length + candidateMethods.length > 1) {
			// TODO: regex whole file and compare line numbers with current position
			candidate = candidateMethods[0];
		} else if (candidateFields.length === 1) {
			candidate = candidateFields[0];
		}
		else if (candidateMethods.length === 1) {
			candidate = candidateMethods[0];
		}
		else {
			vscode.window.showInformationMessage('No candidate found');
			return;
		}

		let qualifiedName = candidate.name;
		let parent: Parent = candidate.parent;
		while (parent) {
			qualifiedName = parent.name + "." + qualifiedName;
			if (parent instanceof CSharpNamespace) { break; }
			parent = parent.parent;
		}

		vscode.window.showInformationMessage(qualifiedName);
	});

	context.subscriptions.push(disposable);
}

const getSelectedWord = (editor: vscode.TextEditor) => {
	const cursorPosition = editor.selection.active;
	const line = editor.document.lineAt(cursorPosition.line);
	const lineText = line.text;

	// Search backward from cursor position
	let start = cursorPosition.character;
	while (start > 0 && /\w/.test(lineText.charAt(start - 1))) {
		start--;
	}

	// Search forward from cursor position
	let end = cursorPosition.character;
	while (end < lineText.length && /\w/.test(lineText.charAt(end))) {
		end++;
	}

	// Extract the word
	const selectedWord = lineText.slice(start, end);
	return selectedWord;
};

// This method is called when your extension is deactivated
export function deactivate() { }


type Parent = {
	name: string;
	parent: Parent;
};
