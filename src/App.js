import React, { Component } from "react";
import axios from "axios";

//import logo from './logo.svg';
import "./App.css";

var CLIENT_ID = "2302af1ebb9047c8b85d893612476ed0";
var REDIRECT = "http:%2F%2Flocalhost:3000%2Fcallback";
var SCOPE = "user-read-private";
var RESPONSE_TYPE = "token";

class App extends Component {
  constructor(props) {
    super(props);
    const hash = this.getHash();
    this.state = {
      isAuthorised: hash != null,
      token: hash == null ? null : hash.access_token,
      searchTerm: "",
      searchPage: 0,
      pageSize: 10
    };
  }

  handleClick() {
    let authURL =
      "https://accounts.spotify.com/authorize?client_id=" +
      CLIENT_ID +
      "&redirect_uri=" +
      REDIRECT +
      "&scope=" +
      SCOPE +
      "&response_type=" +
      RESPONSE_TYPE;
    window.location = authURL;
  }

  getHash() {
    if (window.location.hash !== "") {
      const hash = window.location.hash
        .substring(1)
        .split("&")
        .reduce(function(initial, item) {
          if (item) {
            var parts = item.split("=");
            initial[parts[0]] = decodeURIComponent(parts[1]);
          }
          return initial;
        }, {});

      window.location.hash = "";
      return hash;
    }
    return null;
  }

  render() {
    const authStatus =
      "Estado de autorización: " +
      (this.state.isAuthorised ? "AUTORIZADO" : "NO AUTORIZADO");
    return (
      <div className="App">
        <div className="App-login">
          {authStatus}
          <br />
          <button className="loginBtn" onClick={() => this.handleClick()}>
            Login con Spotify
          </button>
        </div>
        <br />
        {this.state.isAuthorised ? (
          <Search accessToken={this.state.token} />
        ) : (
          <br />
        )}
        <br />
      </div>
    );
  }
}

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tracks: [],
      lastTerm: "",
      searchTerm: "",
      searchPage: 0,
      noneFound: false
      //pageSize: 10
    };
  }

  onNewSearchClick() {
    if (this.state.searchTerm !== "") {
      const request =
        "https://api.spotify.com/v1/search?query=" +
        this.state.searchTerm +
        "&offset=0&limit=5&type=track";
      this.onSearchRequest(request, true);
    }
  }

  onNextSearchClick() {
    const request =
      "https://api.spotify.com/v1/search?query=" +
      this.state.lastTerm +
      "&offset=" +
      this.state.tracks.length +
      "&limit=15&type=track";
    this.onSearchRequest(request, false);
  }

  onSearchRequest(request, isNew) {
    axios
      .get(request, {
        method: "GET",
        headers: { Authorization: "Bearer " + this.props.accessToken }
      })
      .then(res => {
        this.handleSearchResponse(res.data, isNew);
      })
      .catch(err => console.log("err", err));
  }

  handleSearchResponse(responseData, isNew) {
    let newTracks;
    if (isNew) {
      newTracks = responseData.tracks.items;
    } else {
      newTracks = this.state.tracks.slice(0).concat(responseData.tracks.items);
    }
    let noneFound = (newTracks.length == 0);
    this.setState({
      tracks: newTracks,
      lastTerm: this.state.searchTerm,
      searchTerm: this.state.searchTerm,
      searchPage: this.state.searchPage + 1,
      noneFound: noneFound
    });
  }

  onTermChange(term) {
    this.setState({
      tracks: this.state.tracks,
      searchTerm: term.replace(" ", "+"),
      searchPage: this.setState.searchPage
    });
  }

  render() {
    return (
      <div>
        
        <div>
          <SearchBar onTermChange={value => this.onTermChange(value)} />
          <SearchButton onSearchClick={() => this.onNewSearchClick()} />
        </div>
        {this.state.noneFound ? <Error term={this.state.lastTerm}/>:<br/>}
        <SearchResult tracks={this.state.tracks} />
        {this.state.tracks.length > 0 ? (
          <NextPageButton onNextSearchClick={() => this.onNextSearchClick()} />
        ) : (
          <br />
        )}
      </div>
    );
  }
}

function Error(props) {
  return (
    <div className="App-error-notification">
      No pudimos encontrar la pista: {props.term.replace("+", " ")}
    </div>
  );
}

class SearchButton extends Component {
  render() {
    return (
      <button className="loginBtn" onClick={() => this.props.onSearchClick()}>
        {" "}
        Buscar!{" "}
      </button>
    );
  }
}

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = { searchTerm: "", searchPage: 0, pageSize: 10 };
  }
  render() {
    return (
      <input
        type="text"
        className="input"
        placeholder="Buscar..."
        onChange={e => this.props.onTermChange(e.target.value)}
      />
    );
  }
}

class NextPageButton extends Component {
  render() {
    return (
      <div>
        <button
          className="nextBtn"
          onClick={() => this.props.onNextSearchClick()}
        >
          {" "}
          Mas{" "}
        </button>
      </div>
    );
  }
}

class SearchResult extends Component {
  render() {
    return (
      <div className="App-grid-container">
        {this.props.tracks.map((track, index) => (
          <Track key={track.uri} track={track} />
        ))}
      </div>
    );
  }
}

class Track extends Component {
  render() {
    return (
      <div className="App-track-card">
        <img
          src={this.props.track.album.images[2].url}
          alt={this.props.track.album.name}
        />
        <p>
          <b>{this.props.track.name}</b> <br /> {this.getArtists()}
        </p>
      </div>
    );
  }

  getArtists() {
    var artists = "";
    for (let i = 0; i < this.props.track.artists.length; i++) {
      artists += this.props.track.artists[i].name + ", ";
    }
    artists = artists.substring(0, artists.length - 2);
    return artists;
  }
}

export default App;
export { App, Search };
