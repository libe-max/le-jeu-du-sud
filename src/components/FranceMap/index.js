import React, { Component } from 'react'

class FranceMap extends Component {
  constructor () {
    super()
  }

  render () {
    const { data } = this.props
    const mapWestBound = -4.795264
    const mapEastBound = 9.560000
    const mapSouthBound = 41.364524
    const mapNorthBound = 51.088957
    return <div style={{
      position: 'relative',
      width: 'calc(100vw - 2rem)',
      height: 'calc(0.985853 * (100vw - 2rem))',
      maxWidth: '63rem',
      maxHeight: 'calc(0.985853 * 63rem)',
      backgroundImage: 'url(./france-map.svg)'
    }}>{
      data.map(city => {
        const voteRatio = 100 * city.south / (city.north + city.south)
        const vPos = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
        const vPosCorrect = vPos + 2 * Math.pow(Math.sin(Math.PI * vPos / 100), 2)
        const hPos = 100 * (city.longitude - mapWestBound) / (mapEastBound - mapWestBound)
        return <div
          key={city.name}
          style={{
            position: 'absolute',
            top: `${vPosCorrect}%`,
            left: `${hPos}%`,
            width: '.5rem',
            height: '.5rem',
            borderRadius: '2rem',
            background: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
            transform: 'translate(-50%, 0)'
          }}>
          <span style={{position: 'relative', width: 0, height: 0}}>{city.name}</span>
        </div>
      })
    }</div>
  }
}

export default FranceMap
