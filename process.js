const MAX_VALUE = 100
const HIT_COUNT = 3

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function bernoulli(p) {
	return Math.random() < p
}

function randomSign(acc, probDecrease) {
	if (probDecrease === undefined) {
		probDecrease = 0.3 + (acc / MAX_VALUE) * 0.6
	}
	if (bernoulli(probDecrease)) {
		const PROB_DIV = 0.65
		return bernoulli(PROB_DIV) ? '/' : '-'
	}
	return bernoulli(0.5) ? '*' : '+'
}

function generate(acc) {
	let probDecrease = localStorage["simpleCount"] >= 2 ? 0 : undefined
	let sign = randomSign(acc, probDecrease)
	for (let i = 0; ; i++) {
		if (i > 100) {
			i = 0;
			// Не получается подобрать выражение с данным знаком. Странно
			sign = randomSign(acc)
		}
		let lowerBound = 0
		if (probDecrease == 0) {
			if (sign == '*')
				lowerBound = 2
			else if (sign == '+')
				lowerBound = 5
		}
		let b = getRandomInt(lowerBound, 9)
		localStorage["sign"] = sign
		localStorage["b"] = b
		let result = eval(`${acc} ${sign} ${b}`)
		if (!(result >= 0 && result == Math.floor(result) && result <= MAX_VALUE))
			continue
		if (result == acc || result == 0 || result == 1) {
			if (localStorage["lastStupid"] < 6) {
				sign = randomSign(acc);
				continue
			}
			localStorage["lastStupid"] = 0
		} else {
			localStorage["lastStupid"]++
		}
		if (result <= 10) {
			localStorage["simpleCount"]++
		} else {
			localStorage["simpleCount"] = 0
		}
		if (sign == '*')
			sign = '×'
		else if (sign == '/')
			sign = ':'
		return [`${sign} ${b}`, `${acc} ${sign} ${b} = `, result]
	}
}

function updateExpr() {
	let [exprRight, exprStr, result] = generate(localStorage["acc"]);
	localStorage["exprRight"] = exprRight
	localStorage["exprStr"] = exprStr
	localStorage["result"] = result
}

function setResult(res) {
	let elem = document.getElementById("ok")
	if (res == "ok") {
		elem.innerText = "Правильно!"
		elem.className = "correct"
		document.getElementById("hp").className = "correct"
	} else if (res == "fail") {
		elem.innerText = "Неправильно"
		elem.className = "wrong"
		document.getElementById("hp").className = "wrong"
	} else {
		elem.innerText = "Поехали!"
		elem.className = "correct"
		document.getElementById("hp").className = "correct"
	}
}

function priority(sign) {
	switch (sign) {
		case '+':
		case '-':
			return 0;
		case '*':
		case '/':
			return 1;
	}
	return 2;
}

function check() {
	let answer = document.getElementById("answer").value
	let result = localStorage["result"]
	let hitCount = localStorage["hitCount"]
	let score = Number(localStorage["score"])
	if (answer == result) {
		localStorage["checkResult"] = "ok"
		let longExpr = localStorage["longExpr"]
		// console.log(longExpr)
		if (!longExpr)
			longExpr = localStorage["acc"].toString()
		let sign = localStorage["sign"]
		let b = localStorage["b"]
		if (priority(sign) > priority(localStorage["lastSign"])) {
			longExpr = `(${longExpr})`
		}
		longExpr += ` ${sign} ${b}`
		localStorage["longExpr"] = longExpr
		longExpr += ` = ${answer}`
		localStorage["displayedLongExpr"] = longExpr
		localStorage["lastSign"] = sign

		localStorage["prevAcc"] = localStorage["acc"]
		localStorage["acc"] = answer
		score++
		localStorage["score"] = score

		if (score > localStorage["bestScore"]) {
			localStorage["bestScore"] = score
		}
		document.getElementById("answer").value = ""
		updateExpr()
	} else {
		hitCount--
		localStorage["hitCount"] = hitCount
		localStorage["checkResult"] = "fail"
		if (hitCount == 0) {
			localStorage["score"] = 0
			document.getElementById("ok").innerText += `, хиты закончились. Очки: ${score}. ${document.getElementById("expr").innerText} ${result}`
			resetGame()
		}
	}
	redraw()
}

function resetGame() {
	localStorage["prevAcc"] = ""
	localStorage["acc"] = getRandomInt(1, 9)
	localStorage["longExpr"] = ""
	localStorage["displayedLongExpr"] = ""
	localStorage["lastSign"] = ""
	localStorage["score"] = 0
	localStorage["hitCount"] = HIT_COUNT
	localStorage["lastStupid"] = 0
	localStorage["simpleCount"] = 0
	updateExpr()
	document.getElementById("answer").value = ""
}

function redraw() {
	document.getElementById("hp").innerText = localStorage["hitCount"]
	document.getElementById("hp-max").innerText = HIT_COUNT
	document.getElementById("best-score").innerText = localStorage["bestScore"] ?? 0
	document.getElementById("long-expr").innerText = localStorage["displayedLongExpr"]
	document.getElementById("score").innerText = localStorage["score"]
	document.getElementById("expr").textContent = localStorage["exprStr"]
	document.getElementById("expr-prev").textContent = localStorage["prevAcc"]
	document.getElementById("expr-left").textContent = localStorage["acc"]
	document.getElementById("expr-right").textContent = localStorage["exprRight"]
	setResult(localStorage["checkResult"])
}

function setup() {
	let inIframe = (window !== window.parent)
	if (inIframe) {
		document.getElementById("top-nav").style.display = "none"
	}
	if (!Number(localStorage["hitCount"])) {
		resetGame()
		localStorage["checkResult"] = ""
	}
	redraw()
	document.getElementById("check").addEventListener("click", check)
	document.getElementById("answer").addEventListener("keyup", (event) => {
		if (event.keyCode == 13)
			check()
	})
	document.getElementById("restart").onclick = function () {
		resetGame()
		localStorage["checkResult"] = ""
		redraw()
	}
	document.getElementById("reset").onclick = function () {
		localStorage["bestScore"] = 0
		redraw()
	}

	if (!inIframe && false) {
		// let host = "file:///home/receed/prog/game/"
		let host = "http://109.172.84.96"
		document.getElementById("stable").onclick = function () {
			document.getElementById("default-version").style.visibility = ""
			document.getElementById("ext-version").style.visibility = "hidden"
		}
		document.getElementById("latest").onclick = function () {
			document.getElementById("default-version").style.visibility = "hidden"
			document.getElementById("ext-version").style.visibility = ""
			document.getElementById("ext-version").src = host + "/master/chain1.html"
		}
		document.getElementById("dev").onclick = function () {
			document.getElementById("default-version").style.visibility = "hidden"
			document.getElementById("ext-version").style.visibility = ""
			document.getElementById("ext-version").src = host + "/dev/chain1.html"
		}

		document.querySelectorAll("#version>li>a").forEach((a) => {
			let name = `Версия: ${a.innerText}`
			if (a.id == "stable") {
				document.getElementById("version-dropdown").innerText = name
			}
			a.addEventListener("click", () => {
				document.getElementById("version-dropdown").innerText = name
			})
		})
	}
}

M.AutoInit();
setup();
