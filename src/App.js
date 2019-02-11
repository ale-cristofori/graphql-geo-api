import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {fromLonLat} from 'ol/proj.js';
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


class App extends Component {
  constructor () {
    super();
    this.state = {
      accYears : ["2005","2006","2007","2008","2009","2010",
      "2011","2012","2013","2014","2015","2016","2017"],
      severity: ["Slight","Serious","Fatal"],
      accPoints : [],
      selectedYears: [],
      selectedSeverity: null,
    }
    this.selectYear = this.selectYear.bind(this);
    this.selectSeverity = this.selectSeverity.bind(this);
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

  composeStringQuery(array) {
    let temp = ``;
    array.forEach(element => {
      temp += `"${element}",`
    });
    return temp;
  }

  async getServerData (years,severity) {
    let repString =  `severity:${severity}`;
    if (severity !== null) {
      if(severity.length === 1) {
        repString = `severity:["${severity[0]}"]`;
      }
       else {
        let str = this.composeStringQuery(severity);
        str = str.replace(/,\s*$/, "");
        repString = `severity:[${str}]`;
       }
    }
    try {
      const response = await axios({
        url: 'http://www.yomapo.com/edicycle/server/graphql_test.php',
        method: 'post',
        data: {
          query: `
            query { 
              total(year:[${years}], ${repString}) {
              year,
              count
            }, 
            accidents(year:[${years}], ${repString}) {
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
        }`}});
        return response;
    } catch (error){
      alert("data not returned from Server, try again later")
      console.log(error)
    }
  }

  componentDidMount() {
  }

  render() {
    return (
      <div className="App">
      <MultiSelect onSelectItems={this.selectYear} options={this.state.accYears} className="multi-select-years" />
      <MapComponent features={this.state.accPoints}/>
      <MultiSelect onSelectItems={this.selectSeverity} options={this.state.severity} className="multi-select-severity"/>
      </div>
    );
  }
}


export default App;
