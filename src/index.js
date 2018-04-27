import "./style.css";
import * as d3 from "d3";
import Data from "./data.csv";

//画布大小
let width = 1200;
let height = 900;
let svg = d3.select("body").append("svg")
    .attr("width", "100%").attr("height", height);
let padding = {
    left: 50,
    right: 30,
    top: 20,
    bottom: 20
};
let textWidth = 300 // 播放次数文字占位长度
let dateTextHeight = 24 // 日期占位高度
let dateKey = '日期';

let startIndex = 500; // 开始显示数据位置

// 为分类设置对应颜色
let cateKeys = Object.keys(Data[startIndex]);
cateKeys.splice(0, 1); // 去掉日期字段
let colorArr = d3.schemeSet3;
let colorScheme = {}
for (const x in cateKeys) {
    const element = cateKeys[x];
    let index = x % colorArr.length
    colorScheme[element] = colorArr[index]
}
let barHeight = 30; // 柱状图高度

let xScale = d3.scaleLinear()
    .range([0, width - padding.left - padding.right - textWidth])

let xTopScale = d3.scaleLinear()
    .range([0, width - padding.left - padding.right - textWidth])
let yScaleHeight = height - padding.top - padding.bottom - dateTextHeight
let yScale = d3.scaleBand()
    .domain(d3.range(cateKeys.length))
    .range([0, yScaleHeight])

let yAxis = d3.axisLeft(yScale)

// 画布
let g = svg.append("g").attr("transform", "translate(" + padding.left + "," + padding.top + ")");
let axisTxtColor = '#fff'

//添加顶部x轴
g.append("g").attr('class', 'x-top-axis')
//添加第二条x轴
g.append("g").attr('class', 'x-axis')

//添加y轴
g.append("g")
    .attr('class', 'y-axis')
    .call(function (g) {
        g.call(yAxis)
        g.selectAll('text').text(function (d) {
            return `第${d+1}名`
        }).attr('fill', axisTxtColor)
        g.selectAll('path').attr('stroke', axisTxtColor)
    })

// 画柱图
let gBarBox = g.append('g').attr('class', 'bar-box')

// 柱图文字y偏移量
let barTextDy = barHeight / 3 * 2

// 输出日期
let gDate = g.append('g').attr('class', 'bar-date')
gDate.append('text')
    .attr('x', 0)
    .attr('y', height - dateTextHeight)

// 第二条xx轴样式
function xAxisCall(xAxis, btmAxisY) {
    return function (g) {
        g.call(xAxis)
        g.selectAll('line')
            .attr('y1', 6)
            .attr('y2', (yScaleHeight - btmAxisY))
            .attr('stroke-dasharray', "1, 3")
            .attr('stroke', axisTxtColor)
        g.selectAll('text').attr('fill', axisTxtColor)
        g.selectAll('path').attr('stroke', axisTxtColor)
    }
}

// 顶部x轴样式
function xTopAxisCall(xTopAxis, btmAxisY) {
    return function (g) {
        g.call(xTopAxis)
        g.selectAll('line')
            .attr('y1', -6)
            .attr('y2', btmAxisY)
            .attr('stroke-dasharray', "2, 5")
            .attr('stroke', axisTxtColor)
        g.selectAll('text').attr('fill', axisTxtColor)
        g.selectAll('path').attr('stroke', axisTxtColor)
    }
}
// 柱图y位置
function barY(d, i) {
    return yScale(i) + (height / cateKeys.length - barHeight) / 2;
}
// d3.data函数的key function callback
function dataKeyFn(d, i) {
    return `${d[0]}`
}
// 颜色填充
function fillBarColor(d, i) {
    return colorScheme[d[0]];
}
// 柱图长度函数
function barWidthOrX(d, i) {
    if (i > (sliceIndex - 1)) {
        return xScale(d[1]);
    }
    return xTopScale(d[1]);
}

/*
 * 数值格式处理
 * isAxis 是否为坐标轴
 */
function customFormatNum(isAxis) {
    return function (d) {
        let formatRule = isAxis ? ".1f" : ".2f"
        let formatNumber = d3.format(formatRule)
        let str = formatNumber(d / 1e6) + '百万';
        if (d / 1e6 < 1) {
            str = formatNumber(d / 1e4) + '万';
        }
        if (d / 1e6 >= 10) {
            str = formatNumber(d / 1e7) + '千万';
        }
        if (d / 1e6 >= 100) {
            str = formatNumber(d / 1e8) + '亿';
        }
        if (d === 0) str = 0;
        return str
    }
}
// 柱图文字
function barText(d) {
    return `${d[0]} ${d3.format(",.11")(d[1])} 次 (${customFormatNum(false)(d[1])})`
}

// 处理数据并排序
// 处理后数据格式 [['影视', 0000],['生活', 0000],['广告', 0000],...]
function parseData(data) {
    let arr = []
    for (const key in data) {
        if (key === dateKey) continue;
        const value = data[key];
        arr.push([key, value])
    }
    arr.sort(function (a, b) {
        return d3.descending(a[1], b[1])
    });
    return arr;
}
// 获取处理后数据的key值
function getArrKey(data) {
    return data.map((it) => {
        return it[0]
    })
}
// 获取处理后数据的播放值
function getArrValue(data) {
    return data.map((it) => {
        return it[1]
    })
}

let count = 1;
let totalTime = 120 // 3分钟内演示完所有数据
let delay = totalTime * 1000 / Data.length
let dataLen = Data.length
let durationTime = delay + 80 // 动画时长
let sliceIndex; //x轴分割排序位置
let timeoutFn = function (rs, dateText) {
    return function () {
        // 重定义分割区
        sliceIndex = rs.filter((v, i) => {
            if (v[1] > rs[0][1] * 0.2) {
                return i;
            }
        }).length
        // 每个排名所占高度
        let splitHeight = yScaleHeight / cateKeys.length
        // 第二条x轴所在的y位置
        let bAxisY = splitHeight * sliceIndex - splitHeight / 4 + 3
        let valueArr = getArrValue(rs.slice(sliceIndex));
        let xMin = d3.min(valueArr) / 100
        let xMax = d3.max(valueArr) * 1.05
        xScale.domain([xMin, xMax])
        let xAxis = d3.axisBottom(xScale)
            .tickFormat(customFormatNum(true))
            .ticks(5)
        // 前sliceIndex(如：前3排名)排名的数据
        valueArr = getArrValue(rs.slice(0, sliceIndex));
        let xTopMin = d3.min(valueArr) / 100
        let xTopMax = d3.max(valueArr) * 1.05
        xTopScale.domain([xTopMin, xTopMax]);
        let xTopAxis = d3.axisTop(xTopScale)
            .tickFormat(customFormatNum(true))
            .ticks(5)

        // 更新x轴
        g.select(".x-axis")
            .transition()
            .duration(durationTime)
            .attr("transform", `translate(0, ${bAxisY})`) // 更新第二条x轴y位置
            .call(xAxisCall(xAxis, bAxisY));
        g.select(".x-top-axis")
            .transition()
            .duration(durationTime)
            .call(xTopAxisCall(xTopAxis, bAxisY));
        // 更新柱图
        let bar = gBarBox.selectAll('.bar')
            .data(rs, dataKeyFn)
        bar
            .transition()
            .duration(durationTime)
            .ease(d3.easePolyOut)
            .style('fill', fillBarColor)
            .attr("width", barWidthOrX)
            .attr("y", barY);
        bar.exit().remove();
        bar
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d, i) {
                return 1;
            })
            .attr('width', 0)
            .transition()
            .duration(durationTime)
            .ease(d3.easeCircleIn)
            .attr("y", barY)
            .attr("height", barHeight)
            .style('fill', fillBarColor)
            .attr("width", barWidthOrX);
        // 更新柱图文字
        let barTxt = gBarBox.selectAll('.bar-text')
            .data(rs, dataKeyFn);
        barTxt.exit().remove();
        barTxt
            .transition()
            .duration(durationTime)
            .attr("x", barWidthOrX)
            .attr("y", barY)
            .attr('dx', '2px')
            .attr('dy', barTextDy)
            .text(barText);
        barTxt
            .enter()
            .append('text')
            .attr('class', 'bar-text')
            .attr("x", barWidthOrX)
            .attr("y", barY)
            .attr('dx', '2px')
            .attr('dy', 14)
            .attr('fill', fillBarColor)
            .text(barText);
        // 更新日期
        gDate.select('text').text(dateText)
    }
}
for (let index = startIndex; index < dataLen; index++) {
    const element = Data[index];
    let data = Object.assign({}, element);
    let dateText = element[dateKey]
    let rs = parseData(data);
    setTimeout(timeoutFn(rs, dateText), delay * count);
    count++
}
