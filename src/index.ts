import './stylesheet.scss'

import * as d3 from 'd3'

const svg = d3.select('svg')
const data = [0, 1, 2, 3, 4, 5, 6]
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple']
const speeds = [
  getSpeedForDegreesPerSecond(30),
  getSpeedForDegreesPerSecond(60),
  getSpeedForDegreesPerSecond(120),
  getSpeedForDegreesPerSecond(180),
  getSpeedForDegreesPerSecond(240),
  getSpeedForDegreesPerSecond(300),
  getSpeedForDegreesPerSecond(360)
]

interface CurveItem {
  idX: number
  idY: number
}

const curvesData: CurveItem[] = []
for (let idX = 0; idX < data.length; idX++) {
  for (let idY = 0; idY < data.length; idY++) {
    curvesData.push({ idX, idY })
  }
}

const getNextTimestamp = counterFactory()

enum Dimension {
  horizontal = 'horizontal',
  vertical = 'vertical'
}

interface RenderSettings {
  circleRadiusWithoutStroke: number
  circleMargin: number
  circleStroke: number
  dotRadius: number
  timestamp: number
}

function loop () {
  render({
    timestamp: getNextTimestamp(),
    circleRadiusWithoutStroke: 50,
    circleMargin: 10,
    circleStroke: 2,
    dotRadius: 4
  })
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

function render (renderSettings: RenderSettings) {
  svg
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', `0 0 960 500`)

  const circleRadiusWithStroke = renderSettings.circleRadiusWithoutStroke - renderSettings.circleStroke / 2

  const allDimensions = [Dimension.vertical, Dimension.horizontal]

  for (const dimension of allDimensions) {
    const elements = getCircles(dimension)
    const positioningFunctions = getCirclePositionFactory(renderSettings, dimension)

    elements.newOuterCircles
      .attr('r', circleRadiusWithStroke)
      .attr('cx', positioningFunctions.outerCircleX)
      .attr('cy', positioningFunctions.outerCircleY)

    elements.updatedOuterCircles
      .attr('r', circleRadiusWithStroke)
      .attr('cx', positioningFunctions.outerCircleX)
      .attr('cy', positioningFunctions.outerCircleY)

    elements.newDotCircles
      .attr('r', renderSettings.dotRadius)
      .attr('cx', positioningFunctions.dotCircleX)
      .attr('cy', positioningFunctions.dotCircleY)

    elements.updatedDotCircles
      .attr('r', renderSettings.dotRadius)
      .attr('cx', positioningFunctions.dotCircleX)
      .attr('cy', positioningFunctions.dotCircleY)
  }

  const {
    newDotCircles,
    updatedDotCircles
  } = getCurves()

  const verticalPositioningFunctions = getCirclePositionFactory(renderSettings, Dimension.vertical)
  const horizontalPositioningFunctions = getCirclePositionFactory(renderSettings, Dimension.horizontal)

  newDotCircles
    .attr('r', renderSettings.dotRadius)
    .attr('cx', (d) => horizontalPositioningFunctions.dotCircleX(d.idX))
    .attr('cy', (d) => verticalPositioningFunctions.dotCircleY(d.idY))

  updatedDotCircles
    .attr('r', renderSettings.dotRadius)
    .attr('cx', (d) => horizontalPositioningFunctions.dotCircleX(d.idX))
    .attr('cy', (d) => verticalPositioningFunctions.dotCircleY(d.idY))
}

function getCircles (dimension: Dimension) {
  const groups = svg
    .selectAll(`g.${dimension}`)
    .data(data)

  const newGroups = groups
    .enter()
    .append('g')
    .attr('class', dimension)

  const updatedGroups = groups

  const newOuterCircles = newGroups
    .append('circle')
    .attr('class', (d, idx) => `outer-circle stroke-${colors[idx]}`)
  
  const updatedOuterCircles = updatedGroups
    .selectAll('circle.outer-circle')
  
  const newDotCircles = newGroups
    .append('circle')
    .attr('class', 'dot-circle')
  
  const updatedDotCircles = updatedGroups
    .selectAll('circle.dot-circle')
  
  return {
    newOuterCircles,
    updatedOuterCircles,
    newDotCircles,
    updatedDotCircles
  }
}

function getCurves () {
  const groups = svg
    .selectAll('g.curve')
    .data(curvesData)

  const newGroups = groups
    .enter()
    .append('g')
    .attr('class', 'curve')
  
  const updatedGroups = groups

  const newDotCircles = newGroups
    .append('circle')
    .attr('class', 'dot-circle')

  const updatedDotCircles: d3.Selection<SVGCircleElement, CurveItem, d3.BaseType, unknown> = updatedGroups
    .selectAll('circle.dot-circle')

  return {
    newDotCircles,
    updatedDotCircles
  }
}

function getCirclePositionFactory (renderSettings: RenderSettings, dimension: Dimension) {
  const circleDiameterWithoutStroke = renderSettings.circleRadiusWithoutStroke * 2
  const circleDiameterWithMargin = circleDiameterWithoutStroke + renderSettings.circleMargin
  const circleRadiusWithMargin = renderSettings.circleRadiusWithoutStroke + renderSettings.circleMargin

  const functionsForDimension: {[K in Dimension]: {
    outerCircleX (d: number): number
    outerCircleY (d: number): number
    dotCircleX (d: number): number
    dotCircleY (d: number): number
  }} = {
    [Dimension.horizontal] : {
      outerCircleX: outerCircleXHorizontal,
      outerCircleY: outerCircleYHorizontal,
      dotCircleX: dotCircleXHorizontal,
      dotCircleY: dotCircleYHorizontal
    },
    [Dimension.vertical]: {
      outerCircleX: outerCircleXVertical,
      outerCircleY: outerCircleYVertical,
      dotCircleX: dotCircleXVertical,
      dotCircleY: dotCircleYVertical 
    }
  }

  return functionsForDimension[dimension]

  function outerCircleXHorizontal (d: number) {
    return circleDiameterWithMargin * (d + 1) + circleRadiusWithMargin
  }

  function outerCircleYHorizontal (d: number) {
    return circleRadiusWithMargin
  }

  function outerCircleXVertical (d: number) {
    return circleRadiusWithMargin
  }

  function outerCircleYVertical (d: number) {
    return circleDiameterWithMargin * (d + 1) + circleRadiusWithMargin
  }

  function dotCircleXHorizontal (d: number) {
    return (
      circleDiameterWithMargin * (d + 1) + 
      circleRadiusWithMargin + 
      getOffsetFromCenter(renderSettings.timestamp, d, renderSettings.circleRadiusWithoutStroke).xOffset
    )
  }

  function dotCircleYHorizontal (d: number) {
    return (
      outerCircleYHorizontal(d) +
      getOffsetFromCenter(renderSettings.timestamp, d, renderSettings.circleRadiusWithoutStroke).yOffset
    )
  }

  function dotCircleXVertical (d: number) {
    return (
      outerCircleXVertical(d) + 
      getOffsetFromCenter(renderSettings.timestamp, d, renderSettings.circleRadiusWithoutStroke).xOffset
    )
  }

  function dotCircleYVertical (d: number) {
    return (
      circleDiameterWithMargin * (d + 1) + 
      circleRadiusWithMargin + 
      getOffsetFromCenter(renderSettings.timestamp, d, renderSettings.circleRadiusWithoutStroke).yOffset
    )
  }
}

function getOffsetFromCenter (timestamp: number, id: number, radius: number) {
  const angleInDegrees = getAngleInDegrees(timestamp, id)
  const angleInRadians = angleInDegrees * Math.PI / 180
  const xOffset = Math.cos(angleInRadians) * radius
  const yOffset = Math.sin(angleInRadians) * radius

  return {
    xOffset,
    yOffset
  }
}

function getAngleInDegrees (timestamp: number, id: number) {
  return timestamp * speeds[id]
}

function getSpeedForDegreesPerSecond (degreesPerSecond: number) {
  const framesPerSecond = 60
  const degreesPerFrame = degreesPerSecond  / framesPerSecond
  return degreesPerFrame
}

function counterFactory () {
  let c = 0
  return () => ++c
}
