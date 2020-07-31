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
    return <div style={{
      display: 'flex',
      width: 'calc(100vw - 2rem)',
      maxWidth: '63rem',
      height: '140rem',
      justifyContent: 'space-between'
    }}>
      <div style={{
        width: '2rem',
        height: '100%',
        backgroundImage: 'url(./jauge-latitude.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>{
        data.map(city => {
          const vPos = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
          return <div style={{
            position: 'absolute',
            width: '.5rem',
            height: '.5rem',
            borderRadius: '.5rem',
            background: 'red',
            top: `${vPos}%`

          }} />
        })
      }</div>
      
      <div style={{
        flexGrow: '1',
        background: 'yellow',
        height: '100%'
      }}>
        Lines
      </div>

      <div style={{
        width: '2rem',
        height: '100%',
        backgroundImage: 'url(./jauge-votes.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>{

      }</div>
    </div>
  }
}

export default Gauge
