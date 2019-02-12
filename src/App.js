import React, { Component, useState, useEffect  } from 'react';
import PropTypes from 'prop-types'
import {fromLonLat, transform, toLonLat} from 'ol/proj.js';
import axios from 'axios';


import './App.css';
import MapComponent from './Map';


const MultiSelect = (props) => {
  const options = props.options.map((item, index) => 
  <option key={index} value={item}>{item}</option>
  );
  return(
    <div>
      <select
            className={props.className}
            multiple
            onChange={props.onSelectItems}>
            {options}
      </select>
    </div>)
    }

const FilterExtent = (props) => {
  return(
    <div>
      <input type="button" value="Filter Current Extent" onClick={props.onFilterExtent}/>
    </div>
  )
} 

const App = () => {
  const accYears = ["2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017"];
  const severity = ["Slight","Serious","Fatal"];
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState([]);
  const [accPoints, setAccPoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([-355890.8036957806, 7549054.678243506]);
  const [currentExtent, setCurrentExtent] = useState([]);

  const selectSeverity = (e)  => {
    const selectedOptions = e.target.selectedOptions;
    let selectedSeverity = [];
    for(let item of selectedOptions ) {
      selectedSeverity.push(item.value);
    }
    if (selectedSeverity.length === 0) {selectedSeverity = null};
    setSelectedSeverity(selectedSeverity);
  }

  const selectYear = (e)  => {
    const selectedOptions = e.target.selectedOptions;
    let selectedYears = [];
    for(let item of selectedOptions ) {
      selectedYears.push(parseInt(item.value));
    }
    setSelectedYears(selectedYears);
  }
  
  const getInitialExtent = (currentExtent) => {
    setCurrentExtent(currentExtent);
  }

  const updateExtent = (e) => {
    const currentLocation = e.map.getView().getCenter();
    const currentExtent = e.frameState.extent;
    setCurrentExtent(currentExtent);
    setCurrentLocation(currentLocation);
  }


  useEffect (() => {
    console.log(`selected year is ${selectedYears} and selected severity is ${selectedSeverity}`);
  });

  return (
    <div className="App">
    <div className="controls">
    <MultiSelect onSelectItems={selectSeverity} options={severity} className="multi-select-severity"/>
    <MultiSelect onSelectItems={selectYear} options={accYears} className="multi-select-years" />
    <FilterExtent onFilterExtent={null} />
    </div>
    <MapComponent features={accPoints} 
                    currentLocation={currentLocation}
                    getinitialExtent={getInitialExtent}
                    onMapMoved={updateExtent}/>
    </div>
  );
}

/* class App extends Component {
  constructor () {
    super();
    this.state = {
      accYears : ["2005","2006","2007","2008","2009","2010",
      "2011","2012","2013","2014","2015","2016","2017"],
      severity: ["Slight","Serious","Fatal"],
      accPoints : [],
      selectedYears: [],
      selectedSeverity: null,
      currentLocation : [-355890.8036957806, 7549054.678243506],
      currentExtent: []
    }
    this.selectYear = this.selectYear.bind(this);
    this.selectSeverity = this.selectSeverity.bind(this);
    this.updateExtent = this.updateExtent.bind(this);
    this.getInitialExtent = this.getInitialExtent.bind(this);
    this.filterExtent = this.filterExtent.bind(this);
  }

  selectYear(e) {
    const selectedOptions = e.target.selectedOptions;
    let selectedYears = [];
    for(let item of selectedOptions ) {
      selectedYears.push(parseInt(item.value));
    }
    this.setState(() => {
      return {
        selectedYears
      }
    });
  }

  selectSeverity(e) {
    const selectedOptions = e.target.selectedOptions;
    let selectedSeverity = [];
    for(let item of selectedOptions ) {
      selectedSeverity.push(item.value);
    }
    if (selectedSeverity.length === 0) {selectedSeverity = null};
    this.setState(() => {
      return {
        selectedSeverity
      }
    });
  }

  getInitialExtent(currentExtent) {
    this.setState(() => {
      return {
        currentExtent
      }
    });
  }

  updateExtent(e) {
    const currentLocation = e.map.getView().getCenter();
    const currentExtent = e.frameState.extent;
    this.setState(() => {
      return {
        currentExtent,
        currentLocation
      }
    });
  }

  filterExtent() {
    var outerScope = this;
    const minCoords = toLonLat([this.state.currentExtent[0], this.state.currentExtent[1]]);
    const maxCoords = toLonLat([this.state.currentExtent[2], this.state.currentExtent[3]]);
    const lonLatExtent = [minCoords[0], minCoords[1], maxCoords[0], maxCoords[1]];
    outerScope.getServerData(this.state.selectedYears, this.state.selectedSeverity, lonLatExtent).then(response => {
      const accPoints = response.data.data.accidents;
      outerScope.setState({accPoints});
    }).catch(error=> {
      alert("data not returned from Server, try again later")
      console.log(error)
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Typical usage (don't forget to compare props):
    if (this.state.selectedYears !== prevState.selectedYears || this.state.selectedSeverity !== prevState.selectedSeverity) {
      var outerScope = this;
      outerScope.getServerData(this.state.selectedYears, this.state.selectedSeverity).then(response => {
        const accPoints = response.data.data.accidents;
        outerScope.setState({accPoints});
      }).catch(error=> {
        alert("data not returned from Server, try again later")
        console.log(error)
      });
    }
  }

  async getServerData (years, severity, geom) {
    try {
      const response = await axios({
        url: 'http://www.yomapo.com/edicycle/server/graphql_test.php',
        method: 'post',
        data: {
          query: `
          query AccidentsData($years: [Int], $severity: [String], $geom: [Float]) {
              total(year: $years, severity: $severity, geom: $geom) {
              year,
              count
            }, 
            accidents(year: $years , severity: $severity, geom: $geom) {
            type,
            geometry {
              type,
              coordinates
            },
            properties {
              casualty_severity,
              year,
              id
            }
          }
        }`, variables:{years, severity, geom}}});
        return response;
    } catch (error){
      alert("data not returned from Server, try again later")
      console.log(error)
    }
  }

  render() {
    return (
      <div className="App">
      <div className="controls">
        <MultiSelect onSelectItems={this.selectSeverity} options={this.state.severity} className="multi-select-severity"/>
        <MultiSelect onSelectItems={this.selectYear} options={this.state.accYears} className="multi-select-years" />
        <FilterExtent onFilterExtent={this.filterExtent} />
      </div>
      <MapComponent features={this.state.accPoints} 
                      currentLocation={this.state.currentLocation}
                      getinitialExtent={this.getInitialExtent}
                      onMapMoved={this.updateExtent}/>
      </div>
    );
  }
} */


export default App;
