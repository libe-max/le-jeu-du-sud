import React, { Component } from 'react'
import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import ShareArticle from 'libe-components/lib/blocks/ShareArticle'
import LibeLaboLogo from 'libe-components/lib/blocks/LibeLaboLogo'
import ArticleMeta from 'libe-components/lib/blocks/ArticleMeta'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'

const serverUrl = process.env.NODE_ENV === 'production'
  ? 'https://proxydata.liberation.fr/contributions/le-jeu-du-sud'
  : 'http://localhost:3004/contributions/le-jeu-du-sud'

export default class App extends Component {
  /* * * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * * */
  constructor () {
    super()
    this.c = 'le-jeu-du-sud'
    this.state = {
      loading_sheet: true,
      error_sheet: null,
      data_sheet: [],

      mode: 'intro',

      loading_cities: false,
      error_cities: null,
      data_cities: [],
      current_city_nb: 0,

      keystrokes_history: [],
      konami_mode: false
    }
    this.fetchSheet = this.fetchSheet.bind(this)
    this.fetchCredentials = this.fetchCredentials.bind(this)
    this.listenToKeyStrokes = this.listenToKeyStrokes.bind(this)
    this.watchKonamiCode = this.watchKonamiCode.bind(this)
    this.handleActivateGameMode = this.handleActivateGameMode.bind(this)
    this.handleVote = this.handleVote.bind(this)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * DID MOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentDidMount () {
    document.addEventListener('keydown', this.listenToKeyStrokes)
    // this.fetchCredentials()
    if (this.props.spreadsheet) return this.fetchSheet()
    return this.setState({ loading_sheet: false })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WILL UNMOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentWillUnmount () {
    document.removeEventListener('keydown', this.listenToKeyStrokes)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * SHOULD UPDATE
   *
   * * * * * * * * * * * * * * * * */
  shouldComponentUpdate (props, nextState) {
    const changedKeys = []
    Object.keys(nextState).forEach(key => {
      if (this.state[key] !== nextState[key]) changedKeys.push(key)
    })
    if (changedKeys.length === 1 &&
      changedKeys.includes('keystrokes_history')) return false
    return true
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH CREDENTIALS
   *
   * * * * * * * * * * * * * * * * */
  async fetchCredentials () {
    const { api_url } = this.props
    const { format, article } = this.props.tracking
    const api = `${api_url}/${format}/${article}/load`
    try {
      const reach = await window.fetch(api, { method: 'POST' })
      const response = await reach.json()
      const { lblb_tracking, lblb_posting } = response._credentials
      if (!window.LBLB_GLOBAL) window.LBLB_GLOBAL = {}
      window.LBLB_GLOBAL.lblb_tracking = lblb_tracking
      window.LBLB_GLOBAL.lblb_posting = lblb_posting
      return { lblb_tracking, lblb_posting }
    } catch (error) {
      console.error('Unable to fetch credentials:')
      console.error(error)
      return Error(error)
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH SHEET
   *
   * * * * * * * * * * * * * * * * */
  async fetchSheet () {
    this.setState({ loading_sheet: true, error_sheet: null })
    const sheet = this.props.spreadsheet
    try {
      const reach = await window.fetch(this.props.spreadsheet)
      if (!reach.ok) throw reach
      const data = await reach.text()
      const parsedData = data // Parse sheet here
      this.setState({ loading_sheet: false, error_sheet: null, data_sheet: parsedData })
      return data
    } catch (error) {
      if (error.status) {
        const text = `${error.status} error while fetching : ${sheet}`
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(text, error)
        return Error(text)
      } else {
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(error)
        return Error(error)
      }
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * START LISTENING KEYSTROKES
   *
   * * * * * * * * * * * * * * * * */
  listenToKeyStrokes (e) {
    if (!e || !e.keyCode) return
    const currHistory = this.state.keystrokes_history
    const newHistory = [...currHistory, e.keyCode]
    this.setState({ keystrokes_history: newHistory })
    this.watchKonamiCode()
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WATCH KONAMI CODE
   *
   * * * * * * * * * * * * * * * * */
  watchKonamiCode () {
    const konamiCodeStr = '38,38,40,40,37,39,37,39,66,65'
    const lastTenKeys = this.state.keystrokes_history.slice(-10)
    if (lastTenKeys.join(',') === konamiCodeStr) this.setState({ konami_mode: true })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * HANDLE ACTIVATE GAME MODE
   *
   * * * * * * * * * * * * * * * * */
  async handleActivateGameMode (e) {
    try {
      this.setState(curr => ({
        ...curr,
        loading_cities: true,
        error_cities: null,
        data_cities: []
      })) 
      const request = `${serverUrl}/get-10-cities`
      const response = await window.fetch(request, {
        method: 'GET',
        credentials: 'include'
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const body = await response.json()
      if (body.err) throw new Error(body.err)
      console.log(body)
      this.setState(curr => ({
        ...curr,
        mode: 'game',
        loading_cities: false,
        error_cities: null,
        data_cities: body.data
      })) 
    } catch (err) {
      this.setState(curr => ({
        ...curr,
        loading_cities: false,
        error_cities: err.message,
        data_cities: []
      }))
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * HANDLE VOTE
   *
   * * * * * * * * * * * * * * * * */
  handleVote (cityName, voteValue) {
    console.log(cityName, voteValue)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * * */
  render () {
    const { c, state, props } = this

    /* Assign classes */
    const classes = [c]
    if (state.loading_sheet) classes.push(`${c}_loading`)
    if (state.error_sheet) classes.push(`${c}_error`)
    if (state.loading_cities) classes.push(`${c}_loading`)
    if (state.error_cities) classes.push(`${c}_error`)
    if (state.mode === 'intro') classes.push(`${c}_intro-mode`)
    if (state.mode === 'game') classes.push(`${c}_game-mode`)
    if (state.mode === 'results') classes.push(`${c}_results-mode`)

    /* Load & errors */
    if (state.loading_sheet || state.loading_cities) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-loader'>
          <Loader />
        </div>
      </div>
    } else if (state.error_sheet) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-error'>
          <Paragraph>{state.error_sheet}</Paragraph>
          <LoadingError />
        </div>
      </div>
    } else if (state.error_cities) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-error'>
          <Paragraph>{state.error_cities}</Paragraph>
          <LoadingError />
        </div>
      </div>
    }

    /* Logic */
    const currentCityNb = state.current_city_nb
    const currentCity = state.data_cities.length ? state.data_cities[currentCityNb] : {}
    const currentCityName = currentCity.name

    /* Display component */
    return <div className={classes.join(' ')}>
      {/* Intro */}
      <div className='intro-panel'>
        <p>Intro</p>
        <button onClick={this.handleActivateGameMode}>Next</button>
      </div>

      {/* Game */}
      <div className='game-panel'>
        <p>{`${currentCityNb + 1}/10`}</p>
        <p>{`${currentCityName}`}</p>
        <button onClick={e => this.handleVote(currentCityName, 'north')}>Au nord</button>
        <button onClick={e => this.handleVote(currentCityName, 'south')}>Au sud</button>
        <button onClick={e => this.handleVote(currentCityName, 'idk')}>Jsp</button>
      </div>

      {/* Results */}
      <div className='results-panel'>
        <p>Results</p>
        <button onClick={this.handleActivateGameMode}>Play again</button>
      </div>

      {/* Footer */}
      <div className='lblb-default-apps-footer'>
        <ShareArticle short iconsOnly tweet={props.meta.tweet} url={props.meta.url} />
        <ArticleMeta
          publishedOn='01/01/2020 12:00' authors={[
            { name: 'Libé Labo', role: 'Production', link: 'https://www.liberation.fr/libe-labo-data-nouveaux-formats,100538' }
          ]}
        />
        <LibeLaboLogo target='blank' />
      </div>
    </div>
  }
}
