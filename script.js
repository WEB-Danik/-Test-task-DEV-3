let isSelecting = false;
let startX, startY;
let selectedLetters = new Set();
let isCtrlPressed = false;  // Для перевірки, чи натиснута клавіша CTRL

// Відстежуємо натискання CTRL
document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
        isCtrlPressed = true;
    }
});

// Відстежуємо відпускання CTRL
document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
        isCtrlPressed = false;
    }
});

function displayText() {
    const input = document.getElementById('textInput');
    const output = document.getElementById('output');
    const inputValue = input.value; // Отримуємо значення інпуту
    
    // Очищаємо попередній текст
    output.innerHTML = '';
    
    // Очищаємо інпут
    input.value = '';
    
    // Очищаємо вибрані літери
    selectedLetters.clear();
    
    // Очищаємо попередні обробники подій
    document.removeEventListener('mousedown', startSelection);
    document.removeEventListener('mousemove', updateSelection);
    document.removeEventListener('mouseup', endSelection);
    
    // Очищаємо selection box якщо він є
    const selectionBox = document.getElementById('selectionBox');
    if (selectionBox) {
        selectionBox.style.display = 'none';
    }

    // Перевіряємо чи є текст для відображення
    if (!inputValue.trim()) {
        return;
    }

    // Створюємо нові елементи
    inputValue.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('letter');
        span.dataset.index = index;
        span.style.left = `${50 + index * 30}px`;
        span.style.top = '100px';
        span.addEventListener('mousedown', (event) => startDrag(event, span));
        span.addEventListener('click', (event) => selectLetter(event, span));
        output.appendChild(span);
    });

    // Додаємо нові обробники подій
    document.addEventListener('mousedown', startSelection);
    document.addEventListener('mousemove', updateSelection);
    document.addEventListener('mouseup', endSelection);
}

function selectLetter(event, element) {
    if (isCtrlPressed) {
        // Перевіряємо, чи символ вже вибраний
        if (selectedLetters.has(element)) {
            selectedLetters.delete(element);
            element.classList.remove('selected');
        } else {
            selectedLetters.add(element);
            element.classList.add('selected');
        }
    } else {
        // Якщо не натиснута клавіша CTRL, вибір буде одиничним
        selectedLetters.clear(); // Очищаємо попередній вибір
        selectedLetters.add(element);
        element.classList.add('selected');
    }
}

function startDrag(event, element) {
    // Якщо CTRL не натиснута і елемент не вибраний, очищаємо вибір
    if (!isCtrlPressed && !selectedLetters.has(element)) {
        selectedLetters.forEach(el => el.classList.remove('selected'));
        selectedLetters.clear();
        selectedLetters.add(element);
        element.classList.add('selected');
    }

    // Якщо елемент не вибраний і CTRL натиснута, не починаємо перетягування
    if (!selectedLetters.has(element) && isCtrlPressed) {
        return;
    }

    const shiftData = Array.from(selectedLetters).map(letter => ({
        letter,
        shiftX: event.clientX - letter.getBoundingClientRect().left,
        shiftY: event.clientY - letter.getBoundingClientRect().top,
        originalIndex: parseInt(letter.dataset.index)
    }));

    function moveAt(pageX, pageY) {
        shiftData.forEach(({ letter, shiftX, shiftY }) => {
            const newLeft = pageX - shiftX;
            const newTop = pageY - shiftY;
            
            // Перевіряємо, чи не буде перекриття з іншими літерами
            const draggingRect = {
                left: newLeft,
                right: newLeft + letter.offsetWidth,
                top: newTop,
                bottom: newTop + letter.offsetHeight
            };
            
            const otherLetters = Array.from(document.querySelectorAll('.letter')).filter(l => !selectedLetters.has(l));
            let overlappedLetter = null;
            
            for (const otherLetter of otherLetters) {
                const otherRect = otherLetter.getBoundingClientRect();
                if (isOverlapping(draggingRect, otherRect)) {
                    overlappedLetter = otherLetter;
                    break;
                }
            }
            
            if (overlappedLetter) {
                // Зберігаємо позиції обох літер
                const tempLeft = letter.style.left;
                const tempTop = letter.style.top;
                const tempIndex = letter.dataset.index;
                
                // Міняємо місцями позиції
                letter.style.left = overlappedLetter.style.left;
                letter.style.top = overlappedLetter.style.top;
                letter.dataset.index = overlappedLetter.dataset.index;
                
                overlappedLetter.style.left = tempLeft;
                overlappedLetter.style.top = tempTop;
                overlappedLetter.dataset.index = tempIndex;
            } else {
                letter.style.left = `${newLeft}px`;
                letter.style.top = `${newTop}px`;
            }
            
            letter.classList.add('dragging');
        });
    }

    function isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = function () {
        document.removeEventListener('mousemove', onMouseMove);
        document.onmouseup = null;
        selectedLetters.forEach(letter => letter.classList.remove('dragging'));
    };
}

function startSelection(event) {
    if (event.target.tagName === 'SPAN') return;
    isSelecting = true;
    startX = event.clientX;
    startY = event.clientY;
    const selectionBox = document.getElementById('selectionBox');
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
}

function updateSelection(event) {
    if (!isSelecting) return;
    const selectionBox = document.getElementById('selectionBox');
    const width = event.clientX - startX;
    const height = event.clientY - startY;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
    selectionBox.style.left = `${Math.min(startX, event.clientX)}px`;
    selectionBox.style.top = `${Math.min(startY, event.clientY)}px`;

    document.querySelectorAll('.letter').forEach(letter => {
        const rect = letter.getBoundingClientRect();
        const isInside =
            rect.left > Math.min(startX, event.clientX) &&
            rect.right < Math.max(startX, event.clientX) &&
            rect.top > Math.min(startY, event.clientY) &&
            rect.bottom < Math.max(startY, event.clientY);

        if (isInside) {
            if (!selectedLetters.has(letter)) {
                selectedLetters.add(letter);
                letter.classList.add('selected');
            }
        } else if (selectedLetters.has(letter)) {
            selectedLetters.delete(letter);
            letter.classList.remove('selected');
        }
    });
}

function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;
    document.getElementById('selectionBox').style.display = 'none';
}
