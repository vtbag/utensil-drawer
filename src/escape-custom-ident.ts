export function escapeCustomIdent(s: string) {
	const res = [];
	let sep = '';
	const match = s.match(/^-*[0-9]/);
	if (match) {
		res.push(match[0].slice(0, -1));
		res.push('\\3' + match[0].slice(-1));
		sep = ' ';
		s = s.slice(match[0].length);
	}
	for (const c of s) {
		const cp = c.codePointAt(0);
		if (!cp) continue;
		if ((cp >= 48 && cp <= 57) || (cp >= 65 && cp <= 70) || (cp >= 97 && cp <= 102)) {
			res.push(sep + c);
			sep = '';
			continue;
		}
		sep = '';
		if (cp > 127 || (cp >= 71 && cp <= 90) || (cp >= 103 && cp <= 122) || cp === 45 || cp === 95) {
			res.push(c);
			continue;
		}
		if (cp === 127 || cp < 32) {
			res.push(`\\${cp.toString(16)}`);
			sep = ' ';
			continue;
		}

		res.push('\\' + c);
	}
	return res.join('');
}
