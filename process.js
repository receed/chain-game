const MAX_VALUE = 100
const HIT_COUNT = 3

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function bernoulli(p) {
	return Math.random() < p
}

function randomSign(acc) {
	let probDecrease = 0.3 + (acc / MAX_VALUE) * 0.6
	if (bernoulli(probDecrease)) {
		const PROB_DIV = 0.65
		return bernoulli(PROB_DIV) ? '/' : '-'
	}
	return bernoulli(0.5) ? '*' : '+'
}

function generate(acc) {
	let sign = randomSign(acc);
	for (let i = 0; ; i++) {
		if (i > 100) {
			i = 0;
			// Не получается подобрать выражение с данным знаком. Странно
			sign = randomSign(acc)
		}
		let b = getRandomInt(0, 9)
		localStorage.setItem("sign", sign)
		localStorage.setItem("b", b)
		let result = eval(`${acc} ${sign} ${b}`)
		if (!(result >= 0 && result == Math.floor(result) && result <= MAX_VALUE))
			continue
		if (sign == '*')
			sign = '×'
		else if (sign == '/')
			sign = '÷'
		return [`${sign} ${b}`, `${acc} ${sign} ${b} = `, result]
	}
}

function updateExpr() {
	let [exprRight, exprStr, result] = generate(localStorage.getItem("acc"));
	localStorage.setItem("exprRight", exprRight)
	localStorage.setItem("exprStr", exprStr)
	localStorage.setItem("result", result)
}

function setResult(res) {
	transform = {"ok": "Правильно!", "fail": "Неправильно", "": ""}
	document.getElementById("ok").innerText = transform[res]
}

function priority(sign) {
	switch(sign) {
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
	let expr = document.getElementById("expr").innerText
	let answer = document.getElementById("answer").value
	let result = localStorage.getItem("result")
	let hitCount = localStorage.getItem("hitCount")
	let score = Number(localStorage.getItem("score"))
	if (answer == result) {
		setResult("ok")
		let longExpr = localStorage.getItem("longExpr")
		// console.log(longExpr)
		if (!longExpr)
			longExpr = localStorage.getItem("acc").toString()
		let sign = localStorage.getItem("sign")
		let b = localStorage.getItem("b")
		if (priority(sign) > priority(localStorage.getItem("lastSign"))) {
			longExpr = `(${longExpr})`
		}
		longExpr += ` ${sign} ${b}`
		localStorage.setItem("longExpr", longExpr)
		longExpr += ` = ${answer}`
		localStorage.setItem("displayedLongExpr", longExpr)
		localStorage.setItem("lastSign", sign)
		
		localStorage.setItem("prevAcc", localStorage.getItem("acc"))
		localStorage.setItem("acc", answer)
		score++
		localStorage.setItem("score", score)
		
		if (score > localStorage.getItem("bestScore")) {
			localStorage.setItem("bestScore", score)
		}
		document.getElementById("answer").value = ""
		updateExpr()
	} else {
		hitCount--
		localStorage.setItem("hitCount", hitCount)
		setResult("fail")
		if (hitCount == 0) {
			localStorage.setItem("score", 0)
			document.getElementById("ok").innerText += `, хиты закончились. Очки: ${score}. ${document.getElementById("expr").innerText} ${result}`
			resetGame()
		}
	}
	redraw()
}

function resetGame() {
	localStorage.setItem("lastAcc", "")
	localStorage.setItem("acc", getRandomInt(1, 9))
	localStorage.setItem("longExpr", "")
	localStorage.setItem("displayedLongExpr", "")
	localStorage.setItem("lastSign", "")
	localStorage.setItem("score", 0)
	localStorage.setItem("hitCount", HIT_COUNT)
	updateExpr()
	document.getElementById("answer").value = ""
}

function redraw() {
	document.getElementById("hp").innerText = `${localStorage.getItem("hitCount")}/${HIT_COUNT}`
	document.getElementById("best_score").innerText = localStorage.getItem("bestScore") ?? 0
	document.getElementById("long_expr").innerText = localStorage.getItem("displayedLongExpr")
	document.getElementById("score").innerText = localStorage.getItem("score")
	document.getElementById("expr").textContent = localStorage.getItem("exprStr")
	document.getElementById("expr-prev").textContent = localStorage.getItem("prevAcc")
	document.getElementById("expr-left").textContent = localStorage.getItem("acc")
	document.getElementById("expr-right").textContent = localStorage.getItem("exprRight")
	console.log(localStorage.getItem("prevAcc"))
	console.log(localStorage.getItem("acc"))
	console.log(localStorage.getItem("exprRight"))
}

function setup() {
	if (!Number(localStorage.getItem("hitCount")))
		resetGame()
	redraw()
	setResult("")
	document.getElementById("check").addEventListener("click", check)
	document.getElementById("answer").addEventListener("keyup", (event) => {
		if (event.keyCode == 13)
			check()
	})
	document.getElementById("restart").addEventListener("click", () => {
		resetGame()
		redraw()
	})
	document.getElementById("reset").addEventListener("click", () => {
		localStorage.setItem("bestScore", 0)
		redraw()
	})
}

setup();