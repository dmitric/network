import React, { Component } from 'react'
import './App.css'
import Hammer from 'hammerjs'
import sampleSize from 'lodash.samplesize'
import range from 'lodash.range'
import { SketchPicker } from 'react-color'
import reactCSS from 'reactcss'
import tinycolor from 'tinycolor2'

const colorSet = {
  lineColor: '#ffffff',
  backgroundColor: '#111111',
  dottedColor: '#f5f5f5',
}

class App extends Component {
  
  constructor(props) {
    super(props)

    this.state = {
      sides: 6,
      chanceDotted: 1/3,
      lineColor: colorSet.lineColor,
      backgroundColor: colorSet.backgroundColor,
      dottedColor: colorSet.dottedColor,
      pointRadius: 10,
      displayColorPickers: true,
      width: 20,
      height: 20,
      padding: 10,
      maxSides: 8,
      minSides: 1
    }
  }

  updateDimensions () {
    const w = window,
        d = document,
        documentElement = d.documentElement,
        body = d.getElementsByTagName('body')[0]
    
    const width = w.innerWidth || documentElement.clientWidth || body.clientWidth,
        height = w.innerHeight|| documentElement.clientHeight|| body.clientHeight

    const dim = Math.min(width, height) - this.state.padding * 2
    const settings = { width: dim , height: dim }
    
    if (width < 400) {
      settings["padding"] = 40
      settings["pointRadius"] = 4
    } else if (width < 600) {
      settings["padding"] = 60
      settings["pointRadius"] = 5
    } else {
      settings["padding"] = 120
      settings["pointRadius"] = 10
    }

    this.setState(settings)
  }

  handleSave () {
    const svgData = document.getElementsByTagName('svg')[0].outerHTML   
    const link = document.createElement('a')
    
    var svgBlob = new Blob([svgData], { type:"image/svg+xml;charset=utf-8" })
    var svgURL = URL.createObjectURL(svgBlob)
    link.href = svgURL 

    link.setAttribute('download', `network.svg`)
    link.click()
  }

  handleKeydown (ev) {
    if (ev.which === 67) {
      ev.preventDefault()
      this.setState({displayColorPickers: !this.state.displayColorPickers})
    } else if (ev.which === 83 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.handleSave()
    } else if (ev.which === 82) {
      ev.preventDefault()
      this.forceUpdate()
    } else if (ev.which === 40) {
      ev.preventDefault()
      this.removePoint()
    } else if (ev.which === 38) {
      ev.preventDefault()
      this.addPoint()
    }
  }

  removePoint() {
    this.setState({sides: Math.max(this.state.sides - 1, this.state.minSides)})
  }

  addPoint() {
    this.setState({sides: Math.min(this.state.sides + 1, this.state.maxSides)})
  }

  componentWillMount () {
    this.updateDimensions()
  }

  componentDidMount () {
    window.addEventListener("resize", this.updateDimensions.bind(this), true)
    window.addEventListener('keydown', this.handleKeydown.bind(this), true)
    
    const mc = new Hammer(document, { preventDefault: true })

    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    mc.get('pinch').set({ enable: true })

    mc.on("swipedown", ev => this.addPoint())
      .on("swipeup", ev => this.removePoint())

    this.updateDimensions()
  }

  componentWillUnmount () {
    window.removeEventListener("resize", this.updateDimensions.bind(this), true)
    window.removeEventListener('keydown', this.handleKeydown.bind(this), true)
  }

  render() {
    const radius = this.state.width/2 - this.state.padding/2
    const x = this.state.width/2 + this.state.padding

    const points = polygon(x, x, radius, this.state.sides)
    
    const links = linksFromPoints(points)

    const thickLinkIndices = sampleSize(range(links.length), Math.max(0, (Math.random() > 0.4 ? 1 : 0 ) + Math.floor(links.length * this.state.chanceDotted)))
    const drawLast = []

    return (
      <div className="App" style={{ backgroundColor: this.state.backgroundColor, overflow: 'hidden'}}>
        { this.state.displayColorPickers ? <div className="color-pickers">
          <ColorPicker color={tinycolor(this.state.backgroundColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({backgroundColor: color.hex}) } />
          <ColorPicker color={tinycolor(this.state.lineColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({lineColor: color.hex}) } />
          <ColorPicker color={tinycolor(this.state.dottedColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({dottedColor: color.hex }) } />
            </div> : null
        } 
        <svg width={this.state.width + 2 * this.state.padding}
              height={this.state.height + 2 * this.state.padding}>

          <rect width={this.state.width + 2 * this.state.padding}
                height={this.state.width + 2 * this.state.padding}
                fill={this.state.backgroundColor} />
          
          <g className='network'>
             <animateTransform
              attributeType="xml"
              attributeName="transform"
              type="rotate"
              from={`0 ${this.state.height/2 + this.state.padding} ${this.state.height/2 + this.state.padding} `}
              to={`360 ${this.state.height/2 + this.state.padding} ${this.state.height/2 + this.state.padding} `}
              dur="30s"
              repeatCount="indefinite" />
            {
              links.map((link, i) => {
                if (thickLinkIndices.indexOf(i) >= 0) {
                  drawLast.push(i)
                  return null
                } else {
                  return (
                    <line className='dashed' key={i}
                        x1={link[0][0]} y1={link[0][1]}
                        x2={link[1][0]} y2={link[1][1]}
                        stroke={this.state.dottedColor} strokeWidth={this.state.pointRadius/3.5} strokeDasharray={`${this.state.pointRadius*2}, ${this.state.pointRadius}`} />
                  )
                }
              })
            }

            {
              drawLast.map((index) => {
                let link = links[index]

                return (
                    <line key={index}
                        x1={link[0][0]} y1={link[0][1]}
                        x2={link[1][0]} y2={link[1][1]}
                        stroke={this.state.lineColor} strokeWidth={this.state.pointRadius/1.5} />
                  )
              })
            }

            {
              points.map((point, i) => {
                return (<circle key={i} cx={point[0]} cy={point[1]} r={this.state.pointRadius*2} fill={this.state.lineColor} />)
              })
            }
          </g>
        </svg>
      </div>
    )
  }
}

function linksFromPoints(points) {
  const tracker = {}
  const links = []

  for (let i=0; i < points.length; i++) {
    for (let j=0; j < points.length; j++) {
      // don't self link, and we only need one link between each pair
      if (j !== i && (tracker[`${i}-${j}`] === undefined && tracker[`${j}-${i}`] === undefined)) {
        tracker[`${i}-${j}`] = true
        links.push([points[i], points[j]])
      }  
    }
  }

  return links
}

function polygon(x, y, radius, sides) {
  const coordinates = []

  /* 1 SIDE CASE */
  if (sides === 1) {
    return [[x, y]]
  }

  /* > 1 SIDE CASEs */
  for (let i = 0; i < sides; i++) {
    coordinates.push([(x + (Math.sin(2 * Math.PI * i / sides) * radius)), (y - (Math.cos(2 * Math.PI * i / sides) * radius))])
  }

  return coordinates
}

class ColorPicker extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      color: props.color,
      displayColorPicker: props.displayColorPicker,
      disableAlpha: props.disableAlpha
    }
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
    if (this.props.handleClose) {
      this.props.handleClose()
    }
  };

  handleChange = (color) => {
    this.setState({ color: color.rgb })
    this.props.handleChange(color)
  };

  render () {

    const styles = reactCSS({
      'default': {
        color: {
          background: this.state.disableAlpha ?
                `rgb(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b })` :
                `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b },  ${ this.state.color.a })`,
        },
        popover: {
          position: 'absolute',
          zIndex: '10',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    })

    return (
      <div className='color-picker'>
        <div className='swatch' onClick={ this.handleClick }>
          <div className='color' style={ styles.color } />
        </div>
        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleClose }/>
          <SketchPicker color={ this.state.color } onChange={ this.handleChange } disableAlpha={this.state.disableAlpha} />
        </div> : null }
      </div>
    )
  }
}

export default App
