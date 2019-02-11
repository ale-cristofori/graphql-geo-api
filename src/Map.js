import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Map from 'ol/Map';
import View from 'ol/View';
import ol from 'ol';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj.js';
import { OSM, Vector as VectorSource} from 'ol/source.js';
import { KML } from 'ol/format.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { defaults as defaultInteractions, DragAndDrop } from 'ol/interaction.js';
import { Vector as VectorLayer } from 'ol/layer.js';



class MapComponent extends Component {

    static defaultProps = {

    }

    constructor (props) {
        super(props);
        this.mapRef = null;
        this.olMap = null;
        this.setMapRef = element => {
          this.mapRef = element;
        };
        this.uploadFeatsSrc = new VectorSource({
          features: []
        });
        this.uploadLayer = new VectorLayer({
          source: this.uploadFeatsSrc,
          name: 'uploadLayer'
        });
    }

    calculateCentre(extent) {
      const x = extent[0] + (extent[2]-extent[0])/2;
      const y = extent[1] + (extent[3]-extent[1])/2;
      return [x, y];
    }
      
    render() {
        const styles = { height: '50%', width: '50%'}
        return(
        <div style={styles} ref={this.setMapRef}></div>
        )
    }

    componentWillUpdate(nextProps) {
        if (nextProps.features !== []) {
            let source = this.uploadLayer.getSource();
            source.clear();
            let geoJSON = new GeoJSON();
            nextProps.features.forEach(element => {
                try {
                    const feature = geoJSON.readFeature(element);
                    source.addFeature(feature);
                } catch {
                    console.log('error')
                }
            });

        }
    }

    componentDidMount() {
        const mapDOMNode = ReactDOM.findDOMNode(this.mapRef);
        this.olMap = new Map({
            target: mapDOMNode,
            layers: [
              new TileLayer({
                source: new OSM()
              }),
              this.uploadLayer
            ],
            view: new View({
              center: fromLonLat([-3.1970214843749996, 55.952948242579026]),
              zoom: 13
            })
        });
    }
}



export default MapComponent
