const MAX_VALUE = 100
const HIT_COUNT = 3
const ITEMS = 24
const SEGMENT_ANGLE = Math.PI * 2 / ITEMS;

let segments = undefined

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomReal() {
    return getRandomInt(1, 300) / 10
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
		let b = localStorage["level"] == "2" ? getRandomReal() : getRandomInt(lowerBound, 9)
		localStorage["sign"] = sign
		localStorage["b"] = b
		let result = eval(`${acc} ${sign} ${b}`)
		if (localStorage["level"] == "1" && !(result >= 0 && result == Math.floor(result) && result <= MAX_VALUE))
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
		result = Math.round(result * 100) / 100
		return [`${sign} ${b}`, `${acc} ${sign} ${b} = `, result]
	}
}

function rotateSegments() {
	segments.unshift(segments.pop())
	segments[10].children[0].innerHTML = ""
}

function removeBlinking(elem) {
	elem.style["animation-iteration-count"] = "10"
	let listener = (event) => {
		event.target.classList.remove("blinking")
		event.target.removeEventListener("animationiteration", listener)
	}
	elem.addEventListener("animationiteration", listener)
}

function updateExpr() {
	let [exprRight, exprStr, result] = generate(localStorage["acc"]);
	localStorage["exprRight"] = exprRight
	localStorage["exprStr"] = exprStr
	localStorage["result"] = result
	// segments[0].classList.remove("blinking")
	removeBlinking(segments[0])
	// segments[0].style.opacity = "1"
	rotateSegments()
	segments[0].children[0].innerText = exprRight
	rotateSegments()
	segments[0].classList.add("blinking")
}

function setResult(res) {
	let elem = document.getElementById("ok")
	if (res == "ok") {
		elem.innerText = "Правильно!"
		elem.className = "correct"
		document.getElementById("hp").className = "correct"
	} else if (res == "fail") {
		elem.innerText = "Неправильно" + (localStorage["failInfo"] ?? "")
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
	answer = parseFloat(answer.replace(',', '.'))
	let result = localStorage["result"]
	let hitCount = localStorage["hitCount"]
	let score = Number(localStorage["score"])
	if (answer == result) {
		localStorage["checkResult"] = "ok"
		let longExpr = localStorage["longExpr"]
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

		if (localStorage === null || score > localStorage["bestScore"]) {
			localStorage["bestScore"] = score
		}
		document.getElementById("answer").value = ""
		// document.getElementById("expr-next").innerHTML = ""
		let wheel = document.querySelector(".wheel-inner")
		trans = wheel.style.transform
		let angle = 0
		let match = trans.match(/rotateX\((.*)rad\)/)
		if (match) {
			angle = parseFloat(match[1])
		}
		angle += SEGMENT_ANGLE * 2
		wheel.style.transform = `rotateX(${angle}rad)`
		trans = window.getComputedStyle(wheel).transform
		updateExpr()
	} else {
		hitCount--
		localStorage["hitCount"] = hitCount
		localStorage["checkResult"] = "fail"
		localStorage["failInfo"] = ""
		if (hitCount == 0) {
			localStorage["score"] = 0
			localStorage["failInfo"] = `, хиты закончились. Очки: ${score}. ${document.getElementById("expr").innerText} ${result}`
			resetGame()
		}
	}
	redraw()
}

function setLevel(levelId, levelName) {
	localStorage["level"] = levelId
	window.confirm(`Сменить уровень на ${levelName}? Текущий прогресс будет потерян`)
	resetGame()
	redraw()
}

function resetWheel() {
	const wheel = document.querySelector(".wheel .wheel-inner")
	const diameter = wheel.clientHeight
	const radius = diameter / 2;
	const height = radius * Math.tan(SEGMENT_ANGLE / 2) * 2
	wheel.style.transform = `rotateX(0rad)`
	segments.forEach((segment, i) => {
		let transform = `rotateX(${ SEGMENT_ANGLE * (i - 1) }rad) translateZ(${ radius }px)`
		segment.style.height = `${height}px`	
		segment.style.transform = transform
		segment.children[0].innerHTML = ""
		segment.classList.remove("blinking")
	})
	segments[0].classList.add("blinking")
}

function resetGame() {
	resetWheel()
	const wheel = document.querySelector(".wheel .wheel-inner")
	wheel.style.transform = `rotateX(${SEGMENT_ANGLE * 2}rad)`
	localStorage["level"] = localStorage["level"] ?? "1"
	localStorage["prevAcc"] = ""
	localStorage["acc"] = localStorage["level"] == "2" ? getRandomReal() : getRandomInt(1, 9)
	localStorage["longExpr"] = ""
	localStorage["displayedLongExpr"] = ""
	localStorage["lastSign"] = ""
	localStorage["score"] = 0
	localStorage["hitCount"] = HIT_COUNT
	localStorage["lastStupid"] = 0
	localStorage["simpleCount"] = 0
	segments[0].children[0].innerHTML = localStorage["acc"]
	updateExpr()
	document.getElementById("answer").value = ""
}

function loadWheel() {
	let values = JSON.parse(localStorage["segments"])
	for (let i = 0; i < segments.length; i++) {
		segments[i].children[0].innerHTML = values[i]
	}
}

function saveWheel() {
	localStorage["segments"] = JSON.stringify(segments.map((s) => s.children[0].innerHTML))
}

function redraw() {
	saveWheel();
	document.getElementById("hp").innerText = localStorage["hitCount"]
	document.getElementById("hp-max").innerText = HIT_COUNT
	document.getElementById("best-score").innerText = localStorage["bestScore"] ?? 0
	document.getElementById("long-expr").innerText = localStorage["displayedLongExpr"]
	document.getElementById("score").innerText = localStorage["score"]
	document.getElementById("expr").textContent = localStorage["exprStr"]
	// document.getElementById("expr-prev").textContent = localStorage["prevAcc"]
	// document.getElementById("expr-left").textContent = localStorage["acc"]
	// document.getElementById("expr-right").textContent = localStorage["exprRight"]
	setResult(localStorage["checkResult"])
}

function setup() {
	let inIframe = (window !== window.parent)
	if (inIframe) {
		document.getElementById("top-nav").style.display = "none"
	}
	document.getElementById("check").addEventListener("click", check)
	document.getElementById("answer").addEventListener("keyup", (event) => {
		if (event.keyCode == 13)
			check()
	})
	document.getElementById("answer").addEventListener("input", (event) => {
		// document.getElementById("expr-next").innerHTML = event.target.value;
		segments[0].children[0].innerHTML = event.target.value;
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

	document.querySelectorAll("input[name='level']").forEach((input) => {
		input.onclick = (event) => {
			setLevel(event.target.id, event.target.parentElement.innerText)
		}
	})

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
	const wheel = document.querySelector(".wheel .wheel-inner")
	let added = ITEMS - wheel.childElementCount
	for (let i = 0; i < added; i++) {
		wheel.appendChild(wheel.children[0].cloneNode(true))
	}
	segments = Array.from(wheel.children)

	if (Number(localStorage["hitCount"])) {
		resetWheel()
		loadWheel()
	} else {
		resetGame()
		localStorage["checkResult"] = ""
	}
	redraw()
}


M.AutoInit();
setup();
