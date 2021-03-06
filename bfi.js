'use strict';

var $ = function () { return document.querySelector.apply(document, arguments); },
    inp = $('#in'),
    outp = $('#out'),
    slider = $('#slider'),
    value = $('#value'),
    copyButton = $('#copy'),
    run = $('#run'),
    autorun = $('#autorun'),
    test = $('#test'),
    testResult = $('#test_result'),
    N = 5001,
    oldN = 0,
    push = function (array, values) { Array.prototype.push.apply(array, values); },
    numbers = [],
    negatives = [],
    safe = [],
    msi = Number.MAX_SAFE_INTEGER;

function copy (string) {
    var textarea = document.createElement('textarea');
    textarea.style.fontSize = '12pt';
    textarea.style.border = '0';
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.right = '-9999px';
    textarea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
    textarea.setAttribute('readonly', '');
    textarea.value = string;
    document.body.appendChild(textarea);
    //from https://github.com/zenorocha/select/blob/master/src/select.js
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function tryi(n, s, b) {
    if (n >= N)
        return;
    if (numbers[n].length > s.length)
        numbers[n] = s;
    if (safe[n] && safe[n].length > s.length)
        safe[n] = s;
}

function tryiunsafe(n, s) {
    if (n >= N)
        return;
    if (!safe[n])
        safe[n] = numbers[n];
    if (numbers[n].length > s.length)
        numbers[n] = s;
}

function tryn(i, n, s) {
    if (n >= N)
        return;
    var s2 = negatives[i];
    if (s2)
        negatives[n] = s2 + s;
    else
        negatives[n] = '[' + get(i) + ']' + s;
}

function get(i) {
    return safe[i] || numbers[i];
}

function process() {
    if (N > msi)
        N = msi;
    while (N > oldN) {
        var toPush = Math.min(10000, N - oldN + 1);
        push(numbers, Array(toPush).fill().map(function (_, index) {
            return '()'.repeat(oldN + index);
        }));
        oldN += toPush;
    }
    for (var i = 2; i < N; i++) {
        var maxSides = 5;
        for (var j = 1; j < 8; j++) {
            if (i + j >= N)
                break;
            tryi(i, get(i + j) + '[' + get(j) + ']');
        }
        tryi(i + 1, get(i) + '()');
        tryi(i * 2, '(' + get(i) + '){}');
        tryi(i * 3, '((' + get(i) + ')){}{}');
        tryi(i * 3 + 2, '((' + get(i) + ')()){}{}');
        tryiunsafe(i * i, numbers[i] + ')({({})({}[()])}{}');
        tryn(i, i * i, ')({({})({}())}{}');
        for (var k = 5; k <= maxSides; k++) {
            tryiunsafe(Math.floor(((k - 2) * i * i - (k - 4) * i) / 2), numbers[i] + ')({({})({}[()])' + '({})'.repeat(k - 4) + '}{}');
            tryiunsafe(Math.floor(((k - 2) * i * i + (k - 4) * i) / 2), numbers[i] + ')({' + '({})'.repeat(k - 3) + '({}[()])}{}');
            tryn(i, Math.floor(((k - 2) * i * i - (k - 4) * i) / 2), ')({({})({}())' + '({})'.repeat(k - 4) + '}{}');
            tryn(i, Math.floor(((k - 2) * i * i + (k - 4) * i) / 2), ')({' + '({})'.repeat(k - 3) + '({}())}{}');
        }
        var max = Math.floor(Math.pow(i, .5)) + 1;
        for (var l = 1; l < max; l++) {
            if (!(i % l)) {
                var j = 0,
                    k = 0;
                while (k < N) {
                    k = ((i + j + j) * i / l + i) / 2;
                    if (k % 1) {
                        j++;
                        continue;
                    }
                    tryi(k, '(' + get(i) + '){' + get(j) + '({}[' + get(l) + '])}{}');
                    j++;
                }
            }
        }
    }
}

process();
oldN = N;

function add(a, b) {
    return [a[0] + b[0], b[1] + a[1]];
}

function reverse (n) {
    if (!(n instanceof BigNumber))
        n = new BigNumber(n);
    if (!n.mod(1).isZero())
        throw 'Error: not an integer';
    if (n.isZero())
        return '';
    var neg = n.lt(0),
        s = ['(', ')'];
    if (neg)
        n = n.mul(-1);
    while (n.gte(N)) {
        var maxSides = 5;
        if (n.sqrt().mod(1).isZero()) {
            s = add(s, ['', neg ? ')({({})({}())}{}' : ')({({})({}[()])}{}']);
            n = n.sqrt().floor();
            continue;
        }
        var success = false;
        for (var i = 5; i <= maxSides; i++) {
            var polygonNumber = n.mul(8 * i - 16).add((i - 4) * (i - 4)).sqrt().add(i - 4).div(2 * i - 4);
            if (polygonNumber.mod(1).isZero()) {
                console.log('s1', s);
                s = add(s, [
                    '',
                    neg ?
                        ')({({})({}())' + '({})'.repeat(i - 4) + '}{}' :
                        ')({({})({}[()])' + '({})'.repeat(i - 4) + '}{}'
                ]);
                console.log('s2', s);
                n = polygonNumber.floor();
                success = true;
                break;
            }
            polygonNumber = n.mul(8 * i - 16).add((i - 4) * (i - 4)).sqrt().sub(i - 4).div(2 * i - 4);
            if (polygonNumber.mod(1).isZero()) {
                s = add(s, [
                    '',
                    neg ?
                        ')({' + '({})'.repeat(i - 3) + '({}())}{}' :
                        ')({' + '({})'.repeat(i - 3) + '({}[()])}{}'
                ]);
                n = polygonNumber.floor();
                success = true;
                break;
            }
        }
        if (success)
            continue;
        if (n.mod(2).isZero()) {
            s = add(s, ['(', '){}']);
            n = n.divToInt(2);
        } else if (n.mod(3).isZero()) {
            s = add(s, ['((', ')){}{}']);
            n = n.divToInt(3);
        } else if (n.sub(2).mod(3).isZero()) {
            s = add(s, ['((', ')()){}{}']);
            n = n.sub(2).divToInt(3);
        } else {
            s = add(s, ['', '()']);
            n = n.sub(1);
        }
    }
    n = n.toNumber();
    if (!neg)
        return s.join(numbers[n]);
    if (neg && negatives[n])
        return s.join(negatives[n]);
    return '([' + s.join(numbers[n]).slice(1, -1) + '])';
}

function strain (n) {
    var isPrime = Array(n).fill(true);
    for (var i = 2; i <= n; i++) {
        if (isPrime[i]) {
            var j = i << 1;
            while (j < n) {
                isPrime[j] = false;
                j += i;
            }
        }
    }
    return isPrime.map(function (_, i) { return _ && i > 1 &&  i; }).filter(function (o) { return o; });
}

run.onclick = function () {
    var v = inp.value.split(','),
        outputs = [];
    for (var i = 0, val = v[0]; i < v.length; i++, val = v[i]) {
        try {
            var parts = val.split(/[bxo]/);
            var num = 0;
            if (parts.length === 2 && (num = +parts[0])) {
                val = '0' + val.match(/[bxo]/)[0] + parts[1];
                if (num < 0) {
                    val = '-' + val;
                    num *= -1;
                }
                val += '0'.repeat(num);
            }
            outputs.push(reverse(val || 0));
        } catch(e) {
            outputs.push(e.toString().split(': ')[1]);
        }
    }
    outp.value = outputs.join('\n\n');
}

slider.oninput = function () {
    var val = +slider.value;
    if (val < N) {
        slider.value = N;
        return;
    }
    N = val;
    value.innerHTML = N;
}

slider.onchange = function () {
    process();
    oldN = N;
}

copyButton.onclick = function () {
    copy(outp.value);
}

autorun.onchange = function () {
    if (autorun.checked)
        inp.oninput = run.onclick;
    else
        inp.oninput = null;
}

test.onclick = function () {
    if (testResult.innerHTML)
        return;
    if (+slider.value < 10000) {
        slider.value = 10000;
        N = 10000;
        value.innerHTML = N;
        process();
        oldN = 10000;
    }
    var primes = strain(10000).filter(function (value) { return value > 1000; }),
        length = 0;
    console.log(primes);
    for (var i = 0; i < primes.length; i++) {
        console.log(reverse(primes[i]));
        length += reverse(primes[i]).length;
    }
    testResult.innerHTML = 'Bytecount for primes from 1000 to 10000: ' + length;
}

