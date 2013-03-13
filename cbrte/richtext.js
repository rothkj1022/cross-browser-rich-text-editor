// Cross-Browser Rich Text Editor
// Version 3.14
// Written by Kevin Roth (http://www.kevinroth.com/rte/)
// License: http://creativecommons.org/licenses/by/2.5/

//init globals
var lang = "en";
var encoding = "UTF-8";
var debugMode = false;
var isRichText = false;
var defaultWidth = 500;
var defaultHeight = 200;
var allRTEs = "";
var currentRTE = "";
var selectionText = "";
var rng;
var lastCommand;
var maxLoops = 20;
var loopCnt = 0;
var baseUrl = window.parent.document.location.protocol + "//" + document.domain + "/";

var imagesPath = "";
var includesPath = "";
var cssFile = "";
var generateXHTML = true;
var encodeHTML = false;

//browser vars
var ua = navigator.userAgent.toLowerCase();
var isIE = ((ua.indexOf("msie") != -1) && (ua.indexOf("opera") == -1) && (ua.indexOf("webtv") == -1));
var ieVersion = parseFloat(ua.substring(ua.indexOf('msie ') + 5));
//var isGecko = (ua.indexOf("gecko") != -1);
var isGecko = (navigator.product == 'Gecko');
var geckoRv = geckoGetRv();
var isSafari = (ua.indexOf("safari") != -1);
var isIphone = (ua.indexOf("iphone") != -1);
var isIpad = (ua.indexOf("ipad") != -1);
//var safariVersion = parseFloat(ua.substring(ua.lastIndexOf("safari/") + 7));
var webkitVersion = get_webkit_version();
if (webkitVersion) {
	webkitVersion = webkitVersion["major"];
} else {
	webkitVersion = null;
}
var isKonqueror = (ua.indexOf("konqueror") != -1);
var konquerorVersion = parseFloat(ua.substring(ua.indexOf('konqueror/') + 10));
var isOpera = (ua.indexOf("opera") != -1);
var isNetscape = (ua.indexOf("netscape") != -1);
var netscapeVersion = parseFloat(ua.substring(ua.lastIndexOf('/') + 1));

//command vars
var toolbar1Enabled = true;
var toolbar2Enabled = true;

var cmdFormatBlockEnabled = true;
var cmdFontNameEnabled = true;
var cmdFontSizeEnabled = true;
var cmdIncreaseFontSizeEnabled = false;
var cmdDecreaseFontSizeEnabled = false;

var cmdBoldEnabled = true;
var cmdItalicEnabled = true;
var cmdUnderlineEnabled = true;
var cmdStrikethroughEnabled = true;
var cmdSuperscriptEnabled = true;
var cmdSubscriptEnabled = true;

var cmdJustifyLeftEnabled = true;
var cmdJustifyCenterEnabled = true;
var cmdJustifyRightEnabled = true;
var cmdJustifyFullEnabled = true;

var cmdInsertHorizontalRuleEnabled = true;
var cmdInsertOrderedListEnabled = true;
var cmdInsertUnorderedListEnabled = true;

var cmdOutdentEnabled = true;
var cmdIndentEnabled = true;
var cmdForeColorEnabled = true;
var cmdHiliteColorEnabled = true;
var cmdInsertHTMLEnabled = true;
var cmdSpellCheckEnabled = false;
var cmdCreateLinkEnabled = true;
var cmdInsertImageEnabled = true;

var cmdCutEnabled = true;
var cmdCopyEnabled = true;
var cmdPasteEnabled = true;
var cmdUndoEnabled = true;
var cmdRedoEnabled = true;
var cmdRemoveFormatEnabled = true;
var cmdUnlinkEnabled = true;


function initRTE(imgPath, incPath, css, genXHTML, encHTML) {
	//set browser vars
	try {
		//set global vars
		imagesPath = imgPath;
		includesPath = incPath;
		cssFile = css;
		generateXHTML = genXHTML;
		if (encHTML) encodeHTML = true;
		
		//check to see if designMode mode is available and disable unsupported commands
		if (document.designMode) {
			if (document.getElementById && !isIE && !isSafari && !isKonqueror) {
				isRichText = true;
				if (isGecko || isOpera) {
					cmdIncreaseFontSizeEnabled = true;
					cmdDecreaseFontSizeEnabled = true;
					cmdCutEnabled = false;
					cmdCopyEnabled = false;
					cmdPasteEnabled = false;
				}
				if (isNetscape && netscapeVersion < 8) {
					cmdInsertHTMLEnabled = false;
				}
			} else if (isIE && ieVersion >= 5.5) {
				isRichText = true;
				cmdSpellCheckEnabled = true;
			} else if (isSafari && !isIphone && !isIpad) {
				if (webkitVersion >= 420) {
					isRichText = true;
				} else if (webkitVersion >= 312) {
					//Safari 1.3+ is capable of designMode, Safari 1.3 = webkit build 312
					isRichText = true;
					toolbar1Enabled = false;
					cmdStrikethroughEnabled = false;
					cmdJustifyFullEnabled = false;
					cmdInsertHorizontalRuleEnabled = false;
					cmdInsertOrderedListEnabled = false;
					cmdInsertUnorderedListEnabled = false;
					cmdOutdentEnabled = false;
					cmdIndentEnabled = false;
					cmdInsertImageEnabled = false;
					cmdPasteEnabled = false;
					cmdInsertHTMLEnabled = false;
					cmdCreateLinkEnabled = false;
					cmdUnlinkEnabled = false;
					cmdRemoveFormatEnabled = false;
				}
			}
		}
		
		if (isRichText) {
			document.writeln('<style type="text/css">@import "' + includesPath + 'rte.css";</style>');
			document.writeln('<iframe width="150" height="100" id="cp" src="' + includesPath + 'palette.htm" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" style="visibility:hidden; position: absolute;"></iframe>');
			if (isIE) {
				document.onmouseover = raiseButton;
				document.onmouseout  = normalButton;
				document.onmousedown = lowerButton;
				document.onmouseup   = raiseButton;
			}
		}
		
		//for testing standard textarea, uncomment the following line
		//isRichText = false;
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function richTextEditor(id) {
	//creates a richTextEditor object
	this.rteID = id;
	
	//set defaults
	this.html = "";
	this.width = defaultWidth;
	this.height = defaultHeight;
	this.readOnly = false;
	this.toolbar1 = true;
	this.toolbar2 = true;
	
	this.cmdFormatBlock = true;
	this.cmdFontName = true;
	this.cmdFontSize = true;
	this.cmdIncreaseFontSize = false;
	this.cmdDecreaseFontSize = false;
	
	this.cmdBold = true;
	this.cmdItalic = true;
	this.cmdUnderline = true;
	this.cmdStrikethrough = false;
	this.cmdSuperscript = false;
	this.cmdSubscript = false;
	
	this.cmdJustifyLeft = true;
	this.cmdJustifyCenter = true;
	this.cmdJustifyRight = true;
	this.cmdJustifyFull = false;
	
	this.cmdInsertHorizontalRule = true;
	this.cmdInsertOrderedList = true;
	this.cmdInsertUnorderedList = true;
	
	this.cmdOutdent = true;
	this.cmdIndent = true;
	this.cmdForeColor = true;
	this.cmdHiliteColor = true;
	this.cmdInsertLink = true;
	this.cmdInsertImage = true;
	this.cmdInsertSpecialChars = true;
	this.cmdInsertTable = true;
	this.cmdSpellcheck = true;
	
	this.cmdCut = false;
	this.cmdCopy = false;
	this.cmdPaste = false;
	this.cmdUndo = false;
	this.cmdRedo = false;
	this.cmdRemoveFormat = false;
	this.cmdUnlink = false;
	
	this.toggleSrc = true;
	
	//add methods
	this.build = build;
}

function build() {
	with (this) {
		if (isRichText) {
			if (this.readOnly) {
				this.toolbar1 = false;
				this.toolbar2 = false;
				this.toggleSrc = false;
			}
			writeRichText(this);
			enableDesignMode(this.rteID, htmlDecode(this.html), this.readOnly);
			
			if (isGecko && !this.readOnly) {
				//set focus on the RTE
				//needed for firefox < 3 or ul and ol buttons do not work
				currentRTE = this.rteID;
				if (geckoRv < 1.09) {
					insertHTML("<br>");
					rteCommand(this.rteID, "undo");
				}
			}
			
			//uncheck toggle source checkbox
			if (this.toggleSrc) document.getElementById("chkSrc" + this.rteID).checked = false;
		} else {
			writePlainText(this);
		}
	}
}

function writePlainText(rte) {
	if (!rte.readOnly) {
		document.writeln('<textarea name="' + rte.rteID + '" id="' + rte.rteID + '" style="width: ' + rte.width + 'px; height: ' + rte.height + 'px;">' + rte.html + '</textarea>');
	} else {
		document.writeln('<textarea name="' + rte.rteID + '" id="' + rte.rteID + '" style="width: ' + rte.width + 'px; height: ' + rte.height + 'px;" readonly>' + rte.html + '</textarea>');
	}
}

function writeRichText(rte) {
	try {
		if (allRTEs.length > 0) allRTEs += ";";
		allRTEs += rte.rteID;
		
		document.writeln('<table width="' + rte.width + '" cellpadding="0" cellspacing="0" style="border: 1px solid #000;">');
		document.writeln('	<tr>');
		document.writeln('		<td>');
		if (toolbar1Enabled && rte.toolbar1) {
			document.writeln('		<table class="rteBack" cellpadding="2" cellspacing="0" id="toolbar1_' + rte.rteID + '" width="100%">');
			document.writeln('			<tr>');
			if (cmdFormatBlockEnabled && rte.cmdFormatBlock) {
				document.writeln('				<td>');
				document.writeln('					<select id="formatblock_' + rte.rteID + '" onchange="selectFont(\'' + rte.rteID + '\', this.id);">');
				document.writeln('						<option value="">[Style]</option>');
				document.writeln('						<option value="<p>">Paragraph &lt;p&gt;</option>');
				document.writeln('						<option value="<h1>">Heading 1 &lt;h1&gt;</option>');
				document.writeln('						<option value="<h2>">Heading 2 &lt;h2&gt;</option>');
				document.writeln('						<option value="<h3>">Heading 3 &lt;h3&gt;</option>');
				document.writeln('						<option value="<h4>">Heading 4 &lt;h4&gt;</option>');
				document.writeln('						<option value="<h5>">Heading 5 &lt;h5&gt;</option>');
				document.writeln('						<option value="<h6>">Heading 6 &lt;h6&gt;</option>');
				document.writeln('						<option value="<address>">Address &lt;ADDR&gt;</option>');
				document.writeln('						<option value="<pre>">Formatted &lt;pre&gt;</option>');
				document.writeln('					</select>');
				document.writeln('				</td>');
			}
			if (cmdFontNameEnabled && rte.cmdFontName) {
				document.writeln('				<td>');
				document.writeln('					<select id="fontname_' + rte.rteID + '" onchange="selectFont(\'' + rte.rteID + '\', this.id)">');
				document.writeln('						<option value="Font" selected>[Font]</option>');
				document.writeln('						<option value="Arial, Helvetica, sans-serif">Arial</option>');
				document.writeln('						<option value="Courier New, Courier, mono">Courier New</option>');
				document.writeln('						<option value="Times New Roman, Times, serif">Times New Roman</option>');
				document.writeln('						<option value="Verdana, Arial, Helvetica, sans-serif">Verdana</option>');
				document.writeln('					</select>');
				document.writeln('				</td>');
			}
			if (cmdFontSizeEnabled && rte.cmdFontSize) {
				document.writeln('				<td>');
				document.writeln('					<select id="fontsize_' + rte.rteID + '" onchange="selectFont(\'' + rte.rteID + '\', this.id);">');
				document.writeln('						<option value="Size">[Size]</option>');
				document.writeln('						<option value="1">1</option>');
				document.writeln('						<option value="2">2</option>');
				document.writeln('						<option value="3">3</option>');
				document.writeln('						<option value="4">4</option>');
				document.writeln('						<option value="5">5</option>');
				document.writeln('						<option value="6">6</option>');
				document.writeln('						<option value="7">7</option>');
				document.writeln('					</select>');
				document.writeln('				</td>');
			}
			if (cmdIncreaseFontSizeEnabled && rte.cmdIncreaseFontSize)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'increase_font.gif" width="25" height="24" alt="Increase Font Size" title="Increase Font Size" onmousedown="rteCommand(\'' + rte.rteID + '\', \'increasefontsize\')"></td>');
			if (cmdDecreaseFontSizeEnabled && rte.cmdDecreaseFontSize)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'decrease_font.gif" width="25" height="24" alt="Decrease Font Size" title="Decrease Font Size" onmousedown="rteCommand(\'' + rte.rteID + '\', \'decreasefontsize\')"></td>');
			document.writeln('				<td width="100%"></td>');
			document.writeln('			</tr>');
			document.writeln('		</table>');
		}
		if (rte.toolbar2) {
			document.writeln('		<table class="rteBack" cellpadding="0" cellspacing="0" id="toolbar2_' + rte.rteID + '" width="100%">');
			document.writeln('			<tr>');
			if (cmdBoldEnabled && rte.cmdBold)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'bold.gif" width="25" height="24" alt="Bold" title="Bold" onmousedown="rteCommand(\'' + rte.rteID + '\', \'bold\')"></td>');
			if (cmdItalicEnabled && rte.cmdItalic)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'italic.gif" width="25" height="24" alt="Italic" title="Italic" onmousedown="rteCommand(\'' + rte.rteID + '\', \'italic\')"></td>');
			if (cmdUnderlineEnabled && rte.cmdUnderline)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'underline.gif" width="25" height="24" alt="Underline" title="Underline" onmousedown="rteCommand(\'' + rte.rteID + '\', \'underline\')"></td>');
			if (cmdStrikethroughEnabled && rte.cmdStrikethrough)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'strikethrough.gif" width="25" height="24" alt="Strikethrough" title="Strikethrough" onmousedown="rteCommand(\'' + rte.rteID + '\', \'strikethrough\', \'\')"></td>');
			if (cmdSuperscriptEnabled && rte.cmdSuperscript)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'superscript.gif" width="25" height="24" alt="Superscript" title="Superscript" onmousedown="rteCommand(\'' + rte.rteID + '\', \'superscript\')"></td>');
			if (cmdSubscriptEnabled && rte.cmdSubscript)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'subscript.gif" width="25" height="24" alt="Subscript" title="Subscript" onmousedown="rteCommand(\'' + rte.rteID + '\', \'subscript\')"></td>');
//			document.writeln('				<td><img class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="20" border="0" alt=""></td>');
			if (cmdJustifyLeftEnabled && rte.cmdJustifyLeft)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'left_just.gif" width="25" height="24" alt="Align Left" title="Align Left" onmousedown="rteCommand(\'' + rte.rteID + '\', \'justifyleft\')"></td>');
			if (cmdJustifyCenterEnabled && rte.cmdJustifyCenter)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'centre.gif" width="25" height="24" alt="Center" title="Center" onmousedown="rteCommand(\'' + rte.rteID + '\', \'justifycenter\')"></td>');
			if (cmdJustifyRightEnabled && rte.cmdJustifyRight)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'right_just.gif" width="25" height="24" alt="Align Right" title="Align Right" onmousedown="rteCommand(\'' + rte.rteID + '\', \'justifyright\')"></td>');
			if (cmdJustifyFullEnabled && rte.cmdJustifyFull)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'justifyfull.gif" width="25" height="24" alt="Justify Full" title="Justify Full" onmousedown="rteCommand(\'' + rte.rteID + '\', \'justifyfull\')"></td>');
			if (cmdInsertHorizontalRuleEnabled && rte.cmdInsertHorizontalRule)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'hr.gif" width="25" height="24" alt="Horizontal Rule" title="Horizontal Rule" onmousedown="rteCommand(\'' + rte.rteID + '\', \'inserthorizontalrule\')"></td>');
			if (cmdInsertOrderedListEnabled && rte.cmdInsertOrderedList)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'numbered_list.gif" width="25" height="24" alt="Ordered List" title="Ordered List" onmousedown="rteCommand(\'' + rte.rteID + '\', \'insertorderedlist\')"></td>');
			if (cmdInsertUnorderedListEnabled && rte.cmdInsertUnorderedList)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'list.gif" width="25" height="24" alt="Unordered List" title="Unordered List" onmousedown="rteCommand(\'' + rte.rteID + '\', \'insertunorderedlist\')"></td>');
			if (cmdOutdentEnabled && rte.cmdOutdent)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'outdent.gif" width="25" height="24" alt="Outdent" title="Outdent" onmousedown="rteCommand(\'' + rte.rteID + '\', \'outdent\')"></td>');
			if (cmdIndentEnabled && rte.cmdIndent)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'indent.gif" width="25" height="24" alt="Indent" title="Indent" onmousedown="rteCommand(\'' + rte.rteID + '\', \'indent\')"></td>');
			if (cmdForeColorEnabled && rte.cmdForeColor)
				document.writeln('				<td><div id="forecolor_' + rte.rteID + '"><img class="rteImage" src="' + imagesPath + 'textcolor.gif" width="25" height="24" alt="Text Color" title="Text Color" onmousedown="dlgColorPalette(\'' + rte.rteID + '\', \'forecolor\', \'\'); return false;"></div></td>');
			if (cmdHiliteColorEnabled && rte.cmdHiliteColor)
				document.writeln('				<td><div id="hilitecolor_' + rte.rteID + '"><img class="rteImage" src="' + imagesPath + 'bgcolor.gif" width="25" height="24" alt="Background Color" title="Background Color" onmousedown="dlgColorPalette(\'' + rte.rteID + '\', \'hilitecolor\', \'\'); return false;"></div></td>');
			if ((cmdInsertHTMLEnabled || cmdCreateLinkEnabled) && rte.cmdInsertLink)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'hyperlink.gif" width="25" height="24" alt="Insert Link" title="Insert Link" onmousedown="dlgInsertLink(\'' + rte.rteID + '\')"></td>');
			if (cmdUnlinkEnabled && rte.cmdUnlink)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'unlink.gif" width="25" height="24" alt="Remove Link" title="Remove Link" onmousedown="rteCommand(\'' + rte.rteID + '\', \'unlink\')"></td>');
			if (cmdInsertImageEnabled && rte.cmdInsertImage)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'image.gif" width="25" height="24" alt="Add Image" title="Add Image" onmousedown="addImage(\'' + rte.rteID + '\')"></td>');
			if (cmdInsertHTMLEnabled && rte.cmdInsertSpecialChars)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'special_chars.gif" width="25" height="24" alt="Insert Special Character" title="Insert Special Character" onmousedown="dlgInsertSpecialChar(\'' + rte.rteID + '\')"></td>');
			if (cmdInsertHTMLEnabled && rte.cmdInsertTable && !isOpera)
				document.writeln('				<td><div id="table_' + rte.rteID + '"><img class="rteImage" src="' + imagesPath + 'insert_table.gif" width="25" height="24" alt="Insert Table" title="Insert Table" onmousedown="dlgInsertTable(\'' + rte.rteID + '\')"></div></td>');
			if (cmdSpellCheckEnabled && rte.cmdSpellcheck)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'spellcheck.gif" width="25" height="24" alt="Spell Check" title="Spell Check" onmousedown="checkspell()"></td>');
			if (cmdCutEnabled && rte.cmdCut)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'cut.gif" width="25" height="24" alt="Cut" title="Cut" onmousedown="rteCommand(\'' + rte.rteID + '\', \'cut\')"></td>');
			if (cmdCopyEnabled && rte.cmdCopy)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'copy.gif" width="25" height="24" alt="Copy" title="Copy" onmousedown="rteCommand(\'' + rte.rteID + '\', \'copy\')"></td>');
			if (cmdPasteEnabled && rte.cmdPaste)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'paste.gif" width="25" height="24" alt="Paste" title="Paste" onmousedown="rteCommand(\'' + rte.rteID + '\', \'paste\')"></td>');
			if (cmdUndoEnabled && rte.cmdUndo)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'undo.gif" width="25" height="24" alt="Undo" title="Undo" onmousedown="rteCommand(\'' + rte.rteID + '\', \'undo\')"></td>');
			if (cmdRedoEnabled && rte.cmdRedo)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'redo.gif" width="25" height="24" alt="Redo" title="Redo" onmousedown="rteCommand(\'' + rte.rteID + '\', \'redo\')"></td>');
			if (cmdRemoveFormatEnabled && rte.cmdRemoveFormat)
				document.writeln('				<td><img class="rteImage" src="' + imagesPath + 'removeformat.gif" width="25" height="24" alt="Remove Formatting" title="Remove Formatting" onmousedown="rteCommand(\'' + rte.rteID + '\', \'removeformat\')"></td>');
			document.writeln('				<td width="100%"></td>');
			document.writeln('			</tr>');
			document.writeln('		</table>');
		}
		document.writeln('			<iframe id="' + rte.rteID + '" name="' + rte.rteID + '" src="' + includesPath + 'blank.htm" frameborder="0" style="width: 100%; height: ' + rte.height + 'px; margin: 0; padding: 0;"></iframe>');
		document.writeln('		</td>');
		document.writeln('	</tr>');
		document.writeln('</table>');
		document.writeln('<div style="margin: 0; padding: 0;">');
		if (!rte.readOnly && rte.toggleSrc)
			document.writeln('<input type="checkbox" id="chkSrc' + rte.rteID + '" onclick="toggleHTMLSrc(\'' + rte.rteID + '\',' + rte.toolbar1 + ',' + rte.toolbar2 + ');" />&nbsp;<label for="chkSrc' + rte.rteID + '">View Source</label>');
		document.writeln('<input type="hidden" id="hdn' + rte.rteID + '" name="' + rte.rteID + '" value="">');
		document.writeln('</div>');
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function enableDesignMode(rte, html, readOnly) {
	try {
		if (cssFile.length > 0) {
			var frameStyle = "<style type=\"text/css\">@import url(" + cssFile + ");</style>\n";
		} else {
			var frameStyle = "<style type=\"text/css\">\n";
			frameStyle += "body {\n";
			frameStyle += "	background: #FFF;\n";
			frameStyle += "}\n";
			frameStyle += "</style>\n";
		}
		
		var frameHtml = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n";
		frameHtml += "<html id=\"" + rte + "\" xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\">\n";
		frameHtml += "<head>\n";
		frameHtml += "<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\" />\n";
		frameHtml += "<base href=\"" + baseUrl + "\" />\n";
		//if (!isGecko) frameHtml += frameStyle;
		frameHtml += frameStyle;
		frameHtml += "</head>\n";
		frameHtml += "<body style=\"margin: 0; padding: 0;\">\n";
		frameHtml += html + "\n";
		//if (isGecko) frameHtml += frameStyle;
		frameHtml += "</body>\n";
		frameHtml += "</html>";
		
		var oRTE = document.getElementById(rte);
		try {
			if (isGecko) {
				if (!readOnly) oRTE.contentDocument.designMode = "on";
				try {
					var oRTEDoc = oRTE.contentWindow.document;
					oRTEDoc.open("text/html","replace");
					oRTEDoc.write(frameHtml);
					oRTEDoc.close();
					if (!readOnly) oRTEDoc.addEventListener("keypress", geckoKeyPress, true);
				} catch (e) {
					alert("Error preloading content.");
				}
				loopCnt = 0;
			} else if (oRTE.contentWindow) {
				//IE 5.5+
				try {
					var oRTEDoc = oRTE.contentWindow.document;
					oRTEDoc.open("text/html","replace");
					oRTEDoc.write(frameHtml);
					oRTEDoc.close();
					if (!readOnly && isIE) oRTEDoc.attachEvent("onkeypress", evt_ie_keypress);
				} catch (e) {
					alert("Error preloading content.");
				}
				if (!readOnly) oRTEDoc.designMode = "on";
				loopCnt = 0;
			} else {
				//IE5 and Opera
				var oRTEDoc = oRTE.document;
				oRTEDoc.open("text/html","replace");
				oRTEDoc.write(frameHtml);
				oRTEDoc.close();
				if (!readOnly && isIE) oRTEDoc.attachEvent("onkeypress", evt_ie_keypress);
				if (!readOnly) oRTEDoc.designMode = "on";
				loopCnt = 0;
			}
		} catch (e) {
			//some browsers may take some time to enable design mode.
			//Keep looping until able to set.
			if (loopCnt < maxLoops) {
				setTimeout("enableDesignMode('" + rte + "', '" + html + "', " + readOnly + ");", 100);
				loopCnt += 1;
			} else {
				alert("Error enabling designMode.");
			}
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function updateRTE(rte) {
	try {
		if (isRichText) {
			//if viewing source, switch back to design view
			if (document.getElementById("chkSrc" + rte) && document.getElementById("chkSrc" + rte).checked) document.getElementById("chkSrc" + rte).click();
			setHiddenVal(rte);
		} else {
			return;
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function updateRTEs() {
	try {
		if (allRTEs != "") {
			var vRTEs = allRTEs.split(";");
			for (var i = 0; i < vRTEs.length; i++) {
				updateRTE(vRTEs[i]);
			}
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function rteCommand(rte, command, option) {
	//function to perform command
	try {
		var oRTE = document.getElementById(rte);
		if (oRTE.contentWindow) {
			oRTE.contentWindow.focus();
			oRTE.contentWindow.document.execCommand(command, false, option);
		} else {
			oRTE.document.focus();
		  	oRTE.document.execCommand(command, false, option);
		}
		loopCnt = 0;
		
		return false;
	} catch (e) {
		if (debugMode) alert(e);
		//Keep looping until able to set.
		if (loopCnt < maxLoops) {
			setTimeout("rteCommand('" + rte + "', '" + command + "', '" + option + "');", 100);
			loopCnt += 1;
		} else {
			alert("Error executing command.");
		}
	}
}

function dlgColorPalette(rte, command) {
	//function to display or hide color palettes
	try {
		setRange(rte);
		
		//get dialog position
		var buttonElement = document.getElementById(command + '_' + rte);
		var iLeftPos = findPosX(buttonElement);
		var iTopPos = findPosY(buttonElement) + buttonElement.offsetHeight;
		var oDialog = document.getElementById('cp');
		
		oDialog.style.left = iLeftPos + "px";
		oDialog.style.top = iTopPos + "px";
		
		if ((command == lastCommand) && (rte == currentRTE)) {
			//if current command dialog is currently open, close it
			if (oDialog.style.visibility == "hidden") {
				showHideElement('cp', 'show');
			} else {
				showHideElement('cp', 'hide');
			}
		} else {
			showHideElement('cp', 'show');
		}
		
		//save current values
		lastCommand = command;
		currentRTE = rte;
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function dlgInsertTable(rte) {
	//function to open insert table dialog
	try {
		//save current values
		setRange(rte);
		currentRTE = rte;
		InsertTable = popUpWin(includesPath + 'insert_table.htm', 'InsertTable', 360, 180, '');
		if (InsertTable) {
			setTimeout("InsertTable.focus()",100);
		} else {
			alert("Error: While Launching New Window...\nYour browser maybe blocking up Popup windows.\n\nPlease check your Popup Blocker Settings");
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function dlgInsertLink(rte) {
	//function to open insert link dialog
	try {
		if (cmdInsertHTMLEnabled) {
			//save current values
			setRange(rte);
			currentRTE = rte;
			InsertLink = popUpWin(includesPath + 'insert_link.htm?selectionText=' + selectionText, 'InsertLink', 360, 180, '');
			if (InsertLink) {
				setTimeout("InsertLink.focus()",100);
			} else {
				alert("Error: While Launching New Window...\nYour browser maybe blocking up Popup windows.\n\nPlease check your Popup Blocker Settings");
			}
		} else {
			var url = prompt("Enter URL", "http://");
			rteCommand(rte, "createlink", url);
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function dlgInsertSpecialChar(rte) {
	//function to open insert special character dialog
	try {
		//save current values
		setRange(rte);
		currentRTE = rte;
		InsertSpecialChar = popUpWin(includesPath + 'insert_special_char.htm', 'InsertSpecialChar', 360, 250, '');
		if (InsertSpecialChar) {
			setTimeout("InsertSpecialChar.focus()",100);
		} else {
			alert("Error: While Launching New Window...\nYour browser maybe blocking up Popup windows.\n\nPlease check your Popup Blocker Settings");
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function popUpWin (url, win, width, height, options) {
	try {
		var leftPos = (screen.availWidth - width) / 2;
		var topPos = (screen.availHeight - height) / 2;
		options += 'width=' + width + ',height=' + height + ',top=' + topPos + ',left=' + leftPos;
		return window.open(url, win, options);
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function setColor(color) {
	//function to set color
	try {
		var rte = currentRTE;
		if (isSafari || isIE) {
			if (lastCommand == "hilitecolor") lastCommand = "backcolor";
			
			//retrieve selected range
			if (!isSafari) rng.select();
		}
		
		rteCommand(rte, lastCommand, color);
		showHideElement('cp', "hide");
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function addImage(rte) {
	//function to add image
	try {
		imagePath = prompt('Enter Image URL:', 'http://');
		if ((imagePath != null) && (imagePath != "")) {
			rteCommand(rte, 'InsertImage', imagePath);
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

//positioning functions courtesy of Peter-Paul Koch - http://www.quirksmode.org/
function findPosX(obj) {
	var curleft = 0;
	if (obj.offsetParent) {
		curleft = obj.offsetLeft;
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft;
		}
	}
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	if (obj.offsetParent) {
		curtop = obj.offsetTop;
		while (obj = obj.offsetParent) {
			curtop += obj.offsetTop;
		}
	}
	return curtop;
}

function selectFont(rte, selectname) {
	//function to handle font changes
	try {
		var idx = document.getElementById(selectname).selectedIndex;
		// First one is always a label
		if (idx != 0) {
			var selected = document.getElementById(selectname).options[idx].value;
			var cmd = selectname.replace('_' + rte, '');
			rteCommand(rte, cmd, selected);
			document.getElementById(selectname).selectedIndex = 0;
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function insertHTML(html) {
	//function to add HTML -- thanks dannyuk1982
	try {
		if (document.all && !isOpera) {
			rng.pasteHTML(html);
			rng.collapse(false);
			rng.select();
		} else {
			rteCommand(currentRTE, 'inserthtml', html);
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function showHideElement(element, showHide) {
	//function to show or hide elements
	try {
		//element variable can be string or object
		if (document.getElementById(element)) {
			element = document.getElementById(element);
			if (showHide == "show") {
				if (element.id.substring(0,7) == "toolbar") element.style.display = "block";
				element.style.visibility = "visible";
			} else if (showHide == "hide") {
				if (element.id.substring(0,7) == "toolbar") element.style.display = "none";
				element.style.visibility = "hidden";
			}
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function setRange(rte) {
	//function to store range of current selection
	try {
		var oRTE = document.getElementById(rte);
		if (oRTE.contentWindow) {
			var oRTEDoc = oRTE.contentWindow.document;
			oRTE.contentWindow.focus();
		} else {
			var oRTEDoc = oRTE.document;
			oRTEDoc.focus();
		}
		
		if (document.all) {
			sel = oRTEDoc.selection;
			rng = sel.createRange();
			if (encodeHTML) {
				selectionText = htmlEncode(rng.text.toString());
			} else {
				selectionText = rng.text.toString();
			}
		} else if (document.getSelection) {
			rng = oRTEDoc.createRange();
			if (encodeHTML) {
				selectionText = htmlEncode(oRTEDoc.getSelection());
			} else {
				selectionText = oRTEDoc.getSelection();
			}
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function stripHTML(oldString) {
	//function to strip all html
	try {
		var newString = oldString.replace(/(<([^>]+)>)/ig,"");
		
		//replace carriage returns and line feeds
	   newString = newString.replace(/\r\n/g," ");
	   newString = newString.replace(/\n/g," ");
	   newString = newString.replace(/\r/g," ");
		
		//trim string
		newString = trim(newString);
		
		return newString;
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function trim(sInString) {
	//removes leading and trailing spaces from the passed string
	try {
		sInString = sInString.replace(/^\s+/g, "");
		return sInString.replace(/\s+$/g, "");
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function cleanWordContent(wordContent) {
	//strip comments
	wordContent = String(wordContent).replace(/<!--(.|\n)*?-->/g,"");
	
	//strip word tags
	wordContent = String(wordContent).replace(/<\\?\?xml[^>]*>/g,"");
	wordContent = String(wordContent).replace(/<\/?(.*?):[^>]*>/g,"");

	//strip other dangerous tags
	wordContent = String(wordContent).replace(/<\/?xml[^>]*>/g,"");
	wordContent = String(wordContent).replace(/<\/?meta[^>]*>/g,"");
	wordContent = String(wordContent).replace(/<\/?link[^>]*>/g,"");
	wordContent = String(wordContent).replace(/<\/?style[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/&nbsp;/g,"");//<p>&nbsp;</p>
//	wordContent = String(wordContent).replace(/<\/?SPAN[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?FONT[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?STRONG[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?P[^>]*><\/P>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H1[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H2[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H3[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H4[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H5[^>]*>/g,"");
//	wordContent = String(wordContent).replace(/<\/?H6[^>]*>/g,"");
	
	//replace line breaks
	wordContent = String(wordContent).replace(/\n/g," ");

	return trim(wordContent);
}

function toggleHTMLSrc(rte, toolbar1, toolbar2) {
	//contributed by Bob Hutzel (thanks Bob!)
	try {
		var oHdnField = document.getElementById('hdn' + rte);
		var oRTE = document.getElementById(rte);
		if (oRTE.contentWindow) {
			var oRTEDoc = oRTE.contentWindow.document;
		} else {
			var oRTEDoc = oRTE.document;
		}
		
		if (document.getElementById("chkSrc" + rte).checked) {
			//we are checking the box, show source
			if (toolbar1) showHideElement("toolbar1_" + rte, "hide");
			if (toolbar2) showHideElement("toolbar2_" + rte, "hide");
			setHiddenVal(rte);
			if (encodeHTML) {
				var htmlSrc = oRTEDoc.createTextNode(htmlDecode(oHdnField.value));
			} else {
				var htmlSrc = oRTEDoc.createTextNode(oHdnField.value);
			}
			oRTEDoc.body.focus();
			oRTEDoc.body.innerHTML = "";
			oRTEDoc.body.appendChild(htmlSrc);
		} else {
			//we are unchecking the box, show rich text
			if (toolbar1) showHideElement("toolbar1_" + rte, "show");
			if (toolbar2) showHideElement("toolbar2_" + rte, "show");
			
			if (isIE) {
				var htmlSrc = oRTEDoc.body.innerText;
			} else {
				var htmlSrc = oRTEDoc.body.ownerDocument.createRange();
				htmlSrc.selectNodeContents(oRTEDoc.body);
				htmlSrc = htmlSrc.toString();
			}
			setHtmlSrc(rte, htmlSrc);
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function setHiddenVal(rte) {
	//set hidden form field value for current rte
	try {
		var oHdnField = document.getElementById('hdn' + rte);
		if (oHdnField.value == null) oHdnField.value = "";
		
		var html = getHtmlSrc(rte);
		html = cleanWordContent(html);
		
		if (generateXHTML) {
			//convert html output to xhtml (thanks Jacob Lee!)
			html = getXHTML(html);
		}
		
		//if there is no content (other than formatting) set value to nothing
		if (stripHTML(html.replace("&nbsp;", " ")) == "" &&
			html.toLowerCase().search("<hr") == -1 &&
			html.toLowerCase().search("<img") == -1) html = "";
		
		if (encodeHTML) {
			oHdnField.value = htmlEncode(html);
		} else {
			oHdnField.value = html;
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function getHtmlSrc(rte) {
	try {
		var oRTE = document.getElementById(rte);
		if (oRTE.contentWindow) {
			var oRTEDoc = oRTE.contentWindow.document;
		} else {
			var oRTEDoc = oRTE.document;
		}
		return oRTEDoc.body.innerHTML;
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function setHtmlSrc(rte, html) {
	try {
		var oRTE = document.getElementById(rte);
		if (oRTE.contentWindow) {
			var oRTEDoc = oRTE.contentWindow.document;
		} else {
			var oRTEDoc = oRTE.document;
		}
		if (isIE) { //fix for IE
			var output = htmlEncode(html);
			output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
			output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
			oRTEDoc.body.innerHTML = htmlDecode(output);
		} else {
			//replace char 160 with space
			html = strip160(html);
			oRTEDoc.body.innerHTML = html;
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function strip160(strHTML) {
	newString = '';
	for (i = 0; i < strHTML.length; i++) {
		if (strHTML.charCodeAt(i) == 160) {
			newString = newString + ' ';
		} else {
			newString = newString + strHTML.charAt(i);
		}
	}
	return newString;
}

function htmlEncode(text) {
	return text.replace(/\&/ig,  '&amp;').replace(/\</ig,  '&lt;').replace(/\>/ig,  '&gt;').replace(/\"/ig,  '&quot;');
}

function htmlDecode(text) {
	return text.replace(/\&amp\;/ig,  '&').replace(/\&lt\;/ig,  '<').replace(/\&gt\;/ig,  '>').replace(/\&quot\;/ig,  '"');
}

// webkit.org webkit detection scripts
function parse_webkit_version(version) {
	try {
		var bits = version.split(".");
		var is_nightly = (version[version.length - 1] == "+");
		if (is_nightly) {
			var minor = "+";
		} else {
			var minor = parseInt(bits[1]);
			// If minor is Not a Number (NaN) return an empty string
			if (isNaN(minor)) {
				minor = "";
			}
		}
		return {major: parseInt(bits[0]), minor: minor, is_nightly: is_nightly};
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function get_webkit_version() {
	try {
		var regex = new RegExp("\\(.*\\) AppleWebKit/(.*) \\((.*)");
		var matches = regex.exec(navigator.userAgent);
		if (matches) {
			var webkit_version = parse_webkit_version(matches[1]);    
			return {major: webkit_version['major'], minor: webkit_version['minor'], is_nightly: webkit_version['is_nightly']};
		} else {
			return false;
		}
	} catch (e) {
		//if (debugMode) alert(e);
	}
}

//********************
//Gecko-Only Functions
//********************
function geckoKeyPress(evt) {
	//function to add bold, italic, and underline shortcut commands to gecko RTEs
	//contributed by Anti Veeranna (thanks Anti!)
	try {
		var rte = evt.target.id;
		
		if (evt.ctrlKey) {
			var key = String.fromCharCode(evt.charCode).toLowerCase();
			var cmd = '';
			switch (key) {
				case 'b': cmd = "bold"; break;
				case 'i': cmd = "italic"; break;
				case 'u': cmd = "underline"; break;
			};
	
			if (cmd) {
				rteCommand(rte, cmd);
				
				// stop the event bubble
				evt.preventDefault();
				evt.stopPropagation();
			}
	 	}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function geckoGetRv() {
	if (navigator.product != 'Gecko') {
		return -1;
	}
	var rvValue = 0;
	var ua      = navigator.userAgent.toLowerCase();
	var rvStart = ua.indexOf('rv:');
	var rvEnd   = ua.indexOf(')', rvStart);
	var rv      = ua.substring(rvStart+3, rvEnd);
	var rvParts = rv.split('.');
	var exp     = 1;
	
	for (var i = 0; i < rvParts.length; i++) {
		var val = parseInt(rvParts[i]);
		rvValue += val / exp;
		exp *= 100;
	}
	
	return rvValue;
}


//*****************
//IE-Only Functions
//*****************
function evt_ie_keypress(event) {
	try {
		ieKeyPress(event, rte);
	} catch (e) {
		if (debugMode) alert(e);
	}
} 

function ieKeyPress(evt, rte) {
	try {
		var key = (evt.which || evt.charCode || evt.keyCode);
		var stringKey = String.fromCharCode(key).toLowerCase();
		
		//the following breaks list and indentation functionality in IE (don't use)
		//	switch (key) {
		//		case 13:
		//			//insert <br> tag instead of <p>
		//			//change the key pressed to null
		//			evt.keyCode = 0;
		//			
		//			//insert <br> tag
		//			currentRTE = rte;
		//			insertHTML('<br>');
		//			break;
		//	};
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function checkspell() {
	//function to perform spell check
	try {
		var tmpis = new ActiveXObject("ieSpell.ieSpellExtension");
		tmpis.CheckAllLinkedDocuments(document);
	} catch(e) {
		if(e.number==-2146827859) {
			if (confirm("ieSpell not detected.  Click Ok to go to download page."))
				window.open("http://www.iespell.com/download.php","DownLoad");
		} else {
			alert("Error Loading ieSpell: Exception " + e.number);
		}
	}
}

function raiseButton(e) {
	try {
		var el = window.event.srcElement;
		
		className = el.className;
		if (className == 'rteImage' || className == 'rteImageLowered') {
			el.className = 'rteImageRaised';
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function normalButton(e) {
	try {
		var el = window.event.srcElement;
		
		className = el.className;
		if (className == 'rteImageRaised' || className == 'rteImageLowered') {
			el.className = 'rteImage';
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}

function lowerButton(e) {
	try {
		var el = window.event.srcElement;
		
		className = el.className;
		if (className == 'rteImage' || className == 'rteImageRaised') {
			el.className = 'rteImageLowered';
		}
	} catch (e) {
		if (debugMode) alert(e);
	}
}
