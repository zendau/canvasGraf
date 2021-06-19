// Размеры хэлемента
const WIDTH = 1110
const HEIGHT = 600
// Внутренний отступ
const PADDING = 50
// Размеры холста
const DPI_WIDTH = WIDTH * 2
const DPI_HEIGHT = HEIGHT * 2
// Доступная область рисования с учетом внутреннего отступа
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
const VIEW_WIDTH = DPI_WIDTH
// Кол-во колонок
const ROWS_COUNT = 5
const CIRCLE_RADIUS = 10


const COLORS = []

// Функция для построения графика
function chart (canvas, data) {
    
    // Создание холста
    const ctx = canvas.getContext("2d")

    // Получение данных для построения
    const yData = data.columns.filter((_,i) => i !== 0)

    console.log(yData, "yData")

    const xData = data.columns[0].splice(1)
    
    console.log(xData, "xData")

    Object.keys(data.colors).forEach(item => COLORS.push(data.colors[item]))


    // Определяем размеры элемента
    canvas.style.width = WIDTH + "px"
    canvas.style.height = HEIGHT + "px"

    // Определяем размеры холста
    canvas.width = DPI_WIDTH
    canvas.height = DPI_HEIGHT

    // Сохранение requestAnimationFrame
    let raf

    // Подключение слушателя к холсту
    canvas.addEventListener("mousemove", mousemove)
    canvas.addEventListener("mouseleave", mouseleave)

    // Прокси для отслеживания изменений
    const proxy = new Proxy({}, {
        set(...args) {
            const res = Reflect.set(...args)
            raf = requestAnimationFrame(paint)
            return res
        }
    })

    // Метод реализация mousemove
    function mousemove({clientX, clientY}) {
        const { left } = canvas.getBoundingClientRect()
        proxy.mouse = {
            x: (clientX - left) * 2, 
            y:clientY
        }
    }

    function mouseleave() {
        proxy.mouse = null
    }

    function paint() {

        // Очистка холста   
        clear()

        // Находим минимальные и максимальные значения
        const [yMin, yMax] = getMinMax(yData)

        // Пропорция по y
        const yRatio = VIEW_HEIGHT / (yMax - yMin)
        // Пропорция по x
        const xRatio = VIEW_WIDTH / ( yData[0].length - 1)

        // Линии "y" axis
        yAxis(ctx, yMin, yMax)
        // Линии "x" axis
        xAxis(ctx, xData, xRatio, proxy)

        
        // Перебор колонок с данными для построения
        yData.forEach((col,index) => {
            // Определение "x" и "y"

            col = col.slice(1)
            let coords = col.map((y,i) => {
                return [
                    Math.floor(i * xRatio),
                    Math.floor(DPI_HEIGHT - PADDING - y * yRatio)
                ]
            })
            for (const [x, y] of coords) {
                if (isOver(proxy.mouse, x, coords.length)) {
                    circle(ctx, [x,y], COLORS[index])
                }
            }
            // const rdmColor = '#' + (Math.random().toString(16) + '000000').substring(2,8).toUpperCase()

            // Отрисовывание линии
            drawLine(ctx, coords, COLORS[index], yRatio)
        })
    }

    function clear() {
        ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT)
    }


    return {
        init() {
            paint()
        },
        destroy() {
            // Выключение отслеживания анимации
            cancelAnimationFrame(raf)
            canvas.removeEventListener("mousemove", mousemove)
        }
    }
    
}


// Функция для определения максимального и минимального числа
function getMinMax(data) {

    let yMin = 0
    let yMax = 0

    // Перебор по колонкам
    data.forEach(item => {
        // Перебор колонки
        item = item.slice(1)
        item.forEach(y => {
            if (yMin > y) yMin = y
            if (yMax < y) yMax = y
        })  
    })

    return [yMin, yMax]

}


// Функция для рисования линий на графике
function drawLine(ctx, coords, color, yRatio) {
    // Стилизация кисти
    ///////////////////

    // Ширина кисти
    ctx.lineWidth = 2
    // Цвет кисти
    ctx.strokeStyle = color

    // Начало рисования
    ctx.beginPath()

    for (const [x, y] of coords) {
        // Рисуем точку
        // DPI_HEIGHT для того что бы начало графика было слева снизу
        //ctx.lineTo(x, DPI_HEIGHT - y * yRatio - PADDING)
        ctx.lineTo(x, y)
    }

    // Соединение точек
    ctx.stroke()

    // Закрытие кисти
    ctx.closePath()
}

// Функция для рисования "Y axis"
function yAxis(ctx, yMin, yMax) {
    // определяем шаг
    const step = VIEW_HEIGHT / ROWS_COUNT
    
    // определяем шаг текстовой надписи
    const textStep = (yMax - yMin) / ROWS_COUNT

    // Начало рисования
    ctx.beginPath()

    // Стилизация текста
    ctx.font = "normal 20px Helvetica, sanc-serif"
    ctx.fillStyle = "#96a2aa"

    // Стилизация линии
    ctx.strokeStyle = "#96a2aa"
    ctx.lineWidth = 1

    // Перемещение кисти
    ctx.moveTo(0, PADDING)

    const text = Math.round(yMax).toString()

    // Текст на линии
    ctx.fillText(text, 5, PADDING-10)

    // Рисуем точку, от начала y до конца
    ctx.lineTo(DPI_WIDTH, PADDING-10)

    for (let i = 1; i <= ROWS_COUNT; i++) {
        const y = step *i

        // Перемещение кисти
        ctx.moveTo(0, y+PADDING)

        const text = Math.round(yMax - textStep * i).toString()

        // Текст на линии
        ctx.fillText(text, 5, y+PADDING-10)

        // Рисуем точку, от начала y до конца
        ctx.lineTo(DPI_WIDTH, y+PADDING)

    }

    // Соединение точек
    ctx.stroke()

    // Закрытие кисти
    ctx.closePath()
}

// Функция для рисования "X axis"
function xAxis(ctx, data, xRatio, {mouse}) {

    // Кол-во колонок
    const colsCount = 6
    // Шаг построения
    const step = Math.round(data.length / colsCount)

    // Начало рисования
    ctx.beginPath()

    // Построение "X axis"
    for (let i = 0; i < data.length; i++) {

        // Нахождение координаты x с учетом пропорции
        const x = i * xRatio + PADDING

        if ((i-1) % step === 0) {
            // Отрисовка текста
            ctx.fillText(new Date(data[i]).toDateString(), x, DPI_HEIGHT-5)
        }
       

        if(isOver(mouse, x, data.length)) {
            ctx.moveTo(x, PADDING)
            ctx.lineTo(x, DPI_HEIGHT - PADDING)
        }
    }

    // Соединение точек
    ctx.stroke()
    // Конец рисования
    ctx.closePath()
}

function isOver(mouse, x, length) {

    if (!mouse) {
        return false
    }

    const width = DPI_WIDTH / length
    return Math.abs(x - mouse.x) < width / 2
}

function circle(ctx, [x,y], color) {
    ctx.beginPath()

    ctx.strokeStyle = color
    ctx.fillStyle = '#fff'
    
    ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI *2)

    ctx.fill()
    ctx.stroke()

    ctx.closePath()
}

const graf = chart(document.getElementById("chart"), dataGraf)
graf.init()