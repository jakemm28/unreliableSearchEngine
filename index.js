const inputForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");

inputForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const queryInput = document.getElementById("query").value;
    const selection = document.querySelector('input[name="selection"]:checked').value;

    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        
        // Simple CSV parsing (assuming first line is header)
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',');
        const domainIndex = headers.indexOf('Domain');
        const rankIndex = headers.indexOf('Site Rank');

        let data = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                domain: values[domainIndex],
                rank: parseInt(values[rankIndex]) || Infinity
            };
        });

        let domains = [];
        if (selection === '2') {
            // Randomly shuffle
            console.log("Using random websites...");
            domains = data
                .sort(() => Math.random() - 0.5)
                .map(d => d.domain);
        } else {
            // Sort by Site Rank
            console.log("Using most popular websites...");
            domains = data
                .sort((a, b) => a.rank - b.rank)
                .map(d => d.domain);
        }

        const baseQuery = `${queryInput} `;
        const maxLength = 2000;
        let siteOperators = [];
        let currentLength = baseQuery.length;

        for (const domain of domains) {
            if (!domain) continue;
            const operator = `site:${domain}`;
            const additionLength = operator.length + (siteOperators.length > 0 ? 4 : 0); // 4 for " OR "

            if (currentLength + additionLength <= maxLength) {
                siteOperators.push(operator);
                currentLength += additionLength;
            } else {
                break;
            }
        }

        const domainsPattern = siteOperators.join(" OR ");
        const searchPrompt = baseQuery + domainsPattern;

        resultsDiv.innerText = `Final query length: ${searchPrompt.length}\n\nFinal search prompt:\n${searchPrompt}`;
        
        // Open the search query in a new tab (Google Search)
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchPrompt)}`;
        window.open(searchUrl, '_blank');

        // Optional: Create a download link for the "search_query.txt"
        const blob = new Blob([searchPrompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'search_query.txt';
        link.innerText = '\n\nDownload search_query.txt';
        resultsDiv.appendChild(link);

    } catch (error) {
        console.error("Error processing CSV:", error);
        resultsDiv.innerText = "Error loading or processing data.csv";
    }
});