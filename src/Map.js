import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import Map from 'ol/Map';
import View from 'ol/View';
import ol from 'ol';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj.js';
import { OSM, Stamen, Vector as VectorSource} from 'ol/source.js';

import { KML } from 'ol/format.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { defaults as defaultInteractions, DragAndDrop } from 'ol/interaction.js';
import { Vector as VectorLayer } from 'ol/layer.js';


const styles = {
  'Slight': new Style({
    image: new CircleStyle({
      radius: 4.5,
      fill: new Fill({color: '#0b6623'}),
      stroke: new Stroke({color: '#ffffff', width: 1.5})
    })
  }),

  'Serious': new Style({
    image: new CircleStyle({
      radius: 4.5,
      fill: new Fill({color: '#ffff00'}),
      stroke: new Stroke({color: '#9933ff', width: 1.5})
    })
  }),

  'Fatal': new Style({
    image: new CircleStyle({
      radius: 4.5,
      fill: new Fill({color: '#f70d1a'}),
      stroke: new Stroke({color: '#ffffff', width: 1.5})
    })
  })
};

// function applies greyscale to every pixel in canvas
const greyscale = (context) => {
  var canvas = context.canvas;
   var width = canvas.width;
   var height = canvas.height;
  var imageData = context.getImageData(0, 0, width, height);
   var data = imageData.data;
  for(let i=0; i<data.length; i += 4){
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    // CIE luminance for the RGB
    var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Show white color instead of black color while loading new tiles:
    if(v === 0.0)
     v=255.0;  
    data[i+0] = v; // Red
    data[i+1] = v; // Green
    data[i+2] = v; // Blue
    data[i+3] = 255; // Alpha
   }
  context.putImageData(imageData,0,0);
   
  }

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
          name: 'uploadLayer',
          style: function(feature) {
            return styles[feature.get('casualty_severity')];
          }
        });
    }

    calculateCentre(extent) {
      const x = extent[0] + (extent[2]-extent[0])/2;
      const y = extent[1] + (extent[3]-extent[1])/2;
      return [x, y];
    }
      
    render() {
        const styles = { height: '50%', width: '70%'}
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
        const greyOSMLayer = new TileLayer({source: new OSM()});
        this.olMap = new Map({
            target: mapDOMNode,
            layers: [
              greyOSMLayer,
              this.uploadLayer
            ],
            view: new View({
              center: this.props.currentLocation,
              zoom: 13
            })
        });
        greyOSMLayer.on('postcompose', (event) => {
          greyscale(event.context)
        });
        this.props.getinitialExtent(this.olMap.getView().calculateExtent());
        this.olMap.on('moveend', this.props.onMapMoved)
    }
}



export default MapComponent
