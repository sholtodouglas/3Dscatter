import React, { Component, useRef, useMemo } from 'react'

import { a } from 'react-spring/three'
import { useSpring } from 'react-spring'
import ReactDOM from 'react-dom'
import * as THREE from 'three'
import { Canvas, extend, useThree, useRender } from 'react-three-fiber'
import DatGui, { DatColor, DatNumber } from '@tim-soft/react-dat-gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import generateHeight from './generateHeight'
import './styles.css'

extend({ OrbitControls })

const SCREEN_WIDTH = window.innerWidth
const SCREEN_HEIGHT = window.innerHeight
const VIEW_SIZE = 300
const ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT

function OrbitControlsComponent() {
  const ref = useRef()
  const { camera } = useThree()
  useRender(() => ref.current && ref.current.update())
  return <orbitControls ref={ref} args={[camera]} enableDamping dampingFactor={0.1} rotateSpeed={1} />
}

const getNewVertices = ({ widthDensity, depthDensity, mountainVariation, geometrySize, heightMultiplier }) => {
  const data = generateHeight(widthDensity, depthDensity, mountainVariation)

  const geometry = new THREE.PlaneBufferGeometry(geometrySize, geometrySize, widthDensity - 1, depthDensity - 1)
  geometry.rotateX(-Math.PI / 2)
  const vertices = geometry.attributes.position.array

  const updatedVertices = []

  for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i] * heightMultiplier
    updatedVertices.push(vertices[i])
  }

  return updatedVertices
}

function Dots({ data }) {
  const widthDensity = data.widthDensity
  const depthDensity = data.depthDensity
  const geometrySize = data.geometrySize
  const dotColor = data.dotColor
  const dotSize = data.dotSize
  const heightMultiplier = data.heightMultiplier
  const mountainVariation = data.mountainVariation

  const vertices = useMemo(() => {
    return getNewVertices({ geometrySize, widthDensity, depthDensity, heightMultiplier, mountainVariation })
  }, [geometrySize, widthDensity, depthDensity, heightMultiplier, mountainVariation])

  // My goal is to use Spring to interpolate between different 'mountain variations'
  // perhaps factor here could be
  const { factor } = useSpring({
    config: { mass: 5, tension: 500, friction: 40 },
    from: { factor: getNewVertices({ geometrySize, widthDensity, depthDensity, heightMultiplier, mountainVariation: 0 }) },
    to: async next => {
      while (true) {
        await next({ factor: getNewVertices({ geometrySize, widthDensity, depthDensity, heightMultiplier, mountainVariation: 1 }) })
        await next({ factor: getNewVertices({ geometrySize, widthDensity, depthDensity, heightMultiplier, mountainVariation: 2 }) })
      }
    }
  })

  return (
    <points
    // geometry={geometry}
    >
      <bufferGeometry attach="geometry">
        <a.bufferAttribute
          attachObject={['attributes', 'position']}
          count={vertices.length / 3}
          // this renders the dots fine
          array={new Float32Array(vertices)}
          // but I can't get the interpolated values to work
          // might be because bufferAttribute must accept a typed array?
          // array={new Float32Array(factor)}
          itemSize={3}
          onUpdate={self => {
            self.needsUpdate = true
            self.verticesNeedUpdate = true
          }}
        />
      </bufferGeometry>

      <pointsMaterial sizeAttenuation attach="material" color={dotColor} depthWrite={false} size={dotSize} />
    </points>
  )
}

class App extends Component {
  state = {
    data: {
      dotSize: 3,
      dotColor: '#11529c',
      geometrySize: 1000,
      depthDensity: 64,
      widthDensity: 64,
      heightMultiplier: 5,
      mountainVariation: 0
    }
  }

  handleUpdate = newData =>
    this.setState(prevState => ({
      data: { ...prevState.data, ...newData }
    }))

  render() {
    const { data } = this.state

    return (
      <>
        <Canvas
          ref={this.ref}
          camera={{
            fov: 75,
            left: (-ASPECT * VIEW_SIZE) / 2,
            right: (ASPECT * VIEW_SIZE) / 2,
            top: VIEW_SIZE / 2,
            bottom: -VIEW_SIZE / 2,
            near: -20000,
            far: 20000,
            zoom: 0.5
          }}
          orthographic
          antialias={false}>
          <OrbitControlsComponent />

          <Dots data={data} />
        </Canvas>

        <DatGui data={data} onUpdate={this.handleUpdate} className="react-dat-gui-relative-position">
          <DatNumber path="dotSize" label="dotSize" min={0.1} max={3} step={0.01} />
          <DatNumber path="geometrySize" label="geometrySize" min={1000} max={10000} step={10} />
          <DatNumber path="depthDensity" label="depthDensity" min={32} max={512} step={64} />
          <DatNumber path="widthDensity" label="widthDensity" min={32} max={512} step={64} />
          <DatNumber path="heightMultiplier" label="heightMultiplier" min={1} max={50} step={1} />
          <DatNumber path="mountainVariation" label="mountainVariation" min={0} max={50} step={1} />
          <DatColor path="dotColor" label="dotColor" />
        </DatGui>
        <p style={{ position: 'fixed', bottom: 0 }}>You can use orbit controls</p>
      </>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
