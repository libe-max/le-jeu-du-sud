import React, { Component } from 'react'

class Gauge extends Component {
  constructor () {
    super()
  }

  render () {
    const { data } = this.props
    const mapWestBound = -4.795264
    const mapEastBound = 9.560000
    const mapSouthBound = 41.364524
    const mapNorthBound = 51.088957
    return <div className='jauge'>
      <div className='jauge__latitude-bar'>{
        data.map(city => {
          const vPos = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
          return <div className='jauge__latitude-point' style={{ top: `${vPos}%` }} />
        })
      }</div>
      
      <div style={{
        flexGrow: '1',
        background: 'yellow',
        height: '100%'
      }}>
        Lines
      </div>

      <div className='jauge__votes-bar'>{
        data.map(city => {
          const vLatitudePos = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
          const voteRatio = 100 * city.south / (city.north + city.south)
          console.log(city)
          return <div className='jauge__votes-point' style={{ top: `${voteRatio}%` }} />
        })
      }</div>
    </div>
  }
}

export default Gauge
