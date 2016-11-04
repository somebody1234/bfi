'use strict';

var inp = document.querySelector('#in'),
    outp = document.querySelector('#out'),
    slider = document.querySelector('#slider'),
    value = document.querySelector('#value'),
    copyButton = document.querySelector('#copy'),
    N = 5001,
    oldN = 0,
    push = function (array, values) { 
        Array.prototype.push.apply(array, values); },
    numbers = [],
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

function tryi(n, s) {
    if (n < N && numbers[n].length > s.length)
        numbers[n] = s;
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
        for (var j = 1; j < 8; j++) {
            if (i + j >= N)
                break;
            tryi(i, numbers[i + j] + '[' + numbers[j] + ']');
        }
        tryi(i + 1, numbers[i] + '()');
        tryi(i * 2, '(' + numbers[i] + '){}');
        tryi(i * 3, '((' + numbers[i] + ')){}{}');
        tryi(i * 3 + 2, '((' + numbers[i] + ')()){}{}');
        tryi(Math.floor((3 * i * i - i) / 2), numbers[i] + ')({({})({}[()])({})}{}');
        tryi(i * i, numbers[i] + ')({({})({}[()])}{}');
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
                    tryi(k, '(' + numbers[i] + '){' + numbers[j] + '({}[' + numbers[l] + '])}{}');
                    j++;
                }
            }
        }
    }
}

process();
oldN = 5001;

function add(a, b) {
    return [a[0] + b[0], b[1] + a[1]];
}

function reverse (n) {
    if (!n.mod(1).isZero())
        throw 'Error: not an integer';
    if (n.isZero())
        return '';
    var s = n.gt(0) ? ['(', ')'] : ['([', '])'];
    if (n.lt(0))
        n = n.mul(-1);
    while (n.gte(N)) {
        if (n.sqrt().mod(1).isZero()) {
            s = add(s, ['', ')({({})({}[()])}{}']);
            n = n.sqrt().floor();
        } else if (n.mul(24).add(1).sqrt().mod(6).eq(5)) {
            s = add(s, ['', ')({({})({}[()])({})}{}']);
            n = n.mul(24).add(1).sqrt().sub(5).divToInt(6);
        } else if (n.sub(2).mod(3).isZero()) {
            s = add(s, ['((', ')()){}{}']);
            n = n.sub(2).divToInt(3);
        } else if (n.mod(3).isZero()) {
            s = add(s, ['((', ')){}{}']);
            n = n.divToInt(3);
        } else if (n.mod(2).isZero()) {
            s = add(s, ['(', '){}']);
            n = n.divToInt(2);
        } else {
            s = add(s, ['', '()']);
            n = n.sub(1);
        }
    }
    return s.join(numbers[n.toNumber()]);
}

run.onclick = function () {
    try {
        var val = inp.value;
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
        outp.value = reverse(new BigNumber(val || 0));
    } catch(e) {
        outp.value = e.toString().split(': ')[1];
    }
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

