# Global DNA and Protein Sequence Alignment (Needleman-Wunsch)

DSA-3 (25CS2103E) project website.

## Run in VS Code
1. Open this folder: File > Open Folder > nw-aligner-website
2. Install the "Live Server" extension (Ritwick Dey)
3. Right-click index.html > Open with Live Server

No extension? Just double-click index.html to open it in your browser.

## Files
- index.html : page content
- style.css  : styling (light and dark theme)
- script.js  : Needleman-Wunsch algorithm and page behaviour (see align())

## Added features
- DNA/RNA and protein input validation
- Save up to 20 recent alignments in browser localStorage
- Load saved alignments from the History section
- Download an alignment report as a TXT file
- Responsive history cards

### Interactive matrix walkthrough
On the Aligner page, use **Next cell**, **Previous**, **Play all**, and **Reset** to reveal the Needleman–Wunsch scoring matrix one cell at a time. The current cell is outlined, traceback-path cells are highlighted, and a progress counter tracks the walkthrough. The interactive matrix is shown for sequences up to 20 characters each.
