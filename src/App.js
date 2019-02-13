import React, { Component } from 'react';
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

const SummaryTable = (props) => {
  const yearsData = props.accTotal.map(item => <tr><td>{item.year}</td><td>{item.count}</td></tr>);
  //const countData =  props.accTotal.map(item => <td>{item.count}</td>);
  return(
  <div>
    <table>
      <tr>
        <th>Year</th>
        <th>N. of accidents</th>
      </tr>
      {yearsData}
    </table>
  </div>)
}

class App extends Component {
  constructor () {
    super();
    this.state = {
      accYears : ["2005","2006","2007","2008","2009","2010",
      "2011","2012","2013","2014","2015","2016","2017"],
      severity: ["Slight","Serious","Fatal"],
      accPoints : [],
      accTotal:  [
        {
          "year": 2005,
          "count": 0
        },
        {
          "year": 2006,
          "count": 0
        },
        {
          "year": 2007,
          "count": 0
        },
        {
          "year": 2008,
          "count": 0
        },
        {
          "year": 2009,
          "count": 0
        },
        {
          "year": 2010,
          "count": 0
        },
        {
          "year": 2011,
          "count": 0
        },
        {
          "year": 2012,
          "count": 0
        },
        {
          "year": 2013,
          "count": 0
        },
        {
          "year": 2014,
          "count": 0
        },
        {
          "year": 2015,
          "count": 0
        },
        {
          "year": 2016,
          "count": 0
        },
        {
          "year": 2017,
          "count": 0
        }
      ],
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
      const accTotal = response.data.data.total;
      outerScope.setState({accPoints, accTotal});
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
        const accTotal = response.data.data.total;
        outerScope.setState({accPoints, accTotal});
      }).catch(error=> {
        alert("data not returned from Server, try again later")
        console.log(error)
      });
    }
  }

  async getServerData (years, severity, geom) {
    try {
      const response = await axios({
        url: 'http://www.yomapo.com/edicycle/server/accidents_api.php',
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
      <div className="container">
        <div className="controls">
          <SummaryTable accTotal={this.state.accTotal} />
          <span>Summary</span>
          <MultiSelect onSelectItems={this.selectSeverity} options={this.state.severity} className="multi-select-severity"/>
          <span>Select Casualty Severity Intensity</span>
          <MultiSelect onSelectItems={this.selectYear} options={this.state.accYears} className="multi-select-years" />
          <span>Select Accident Years</span>
          <FilterExtent onFilterExtent={this.filterExtent} />
        </div>
        <MapComponent features={this.state.accPoints} 
                        currentLocation={this.state.currentLocation}
                        getinitialExtent={this.getInitialExtent}
                        onMapMoved={this.updateExtent}/>
        </div>
      </div>
    );
  }
}


export default App;
