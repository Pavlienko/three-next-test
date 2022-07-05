import React, { useRef, useState } from "react";
import { AdditiveBlending, BackSide, TextureLoader } from "three";
import { Canvas, extend, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, shaderMaterial } from "@react-three/drei";
import glsl from "@mkhatib/babel-plugin-glsl/macro";
import { Suspense } from "react";
import Image from "next/image";

//IMG
import earthMap from "../public/earthMap.jpeg";
import specularMap from "../public/specularmap.jpg";
import toneMap from "../public/specularmap2.jpg";

//CSS
import SceneStyles from "../styles/Scene.module.css";

//COMPONENTS

//CODE
const Scene = (props) => {
  const { canvasWidth, canvasHeight, reviews } = props;

  extend({
    // shaderMaterial creates a THREE.ShaderMaterial, and auto-creates uniform setter/getters
    // extend makes it available in JSX, in this case <sphereMaterial />
    SphereMaterial: shaderMaterial(
      {},
      glsl`
      varying vec3 vNormal;
      void main() {
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
      glsl`
      varying vec3 vNormal;
      void main() {
        float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 10.0 );
        gl_FragColor = vec4( 0.0, 0.5, 1.0, 1.0 ) * intensity;
      }`
    ),
  });

  function polar2Cartesian(lat, lng, relAltitude = 0) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((90 - lng) * Math.PI) / 180;
    const r = 1.001 * (1 + relAltitude);
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    };
  }

  function Globe(props) {

    const colorMap = useLoader(TextureLoader, "/earthMap.jpeg");
    const specularColorMap = useLoader(TextureLoader, "/specularmap.jpg");
    const toneColorMap = useLoader(TextureLoader,"/specularmap2.jpg" );

    const ref = useRef();
    const [hovered, hover] = useState(false);
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame((state, delta) =>
      hovered
        ? (ref.current.rotation.y -= 0)
        : (ref.current.rotation.y -= 0.001)
    );
    return (
      <mesh {...props} ref={ref} scale={2}>
        {/* the html pointers goes here, it takes array of objects (reviews) from API and creates points on sphere*/}
        <group rotation={[0, Math.PI / 2, 0]}>
          {reviews
            ? reviews.map((element) => {
                const pointPos = polar2Cartesian(
                  element.coords[0],
                  element.coords[1]
                );
                return (
                  <Pointer
                    position={[pointPos.x, pointPos.y, pointPos.z]}
                    key={`pointer-number-${element.id}`}
                  >
                    <div
                      className={SceneStyles.pointer}
                      onMouseOver={(event) => hover(true)}
                      onMouseOut={(event) => hover(false)}
                    >
                      <div className={SceneStyles.pointerContentWrapper}>
                        <div className={SceneStyles.pointerContentDescription}>
                          <div className={SceneStyles.pointerContentPhoto}>
                            <img src={element.photo} alt="avatar" />
                          </div>
                          <div
                            className={SceneStyles.pointerContentNameWrapper}
                          >
                            <div className={SceneStyles.pointerContentName}>
                              {element.name}
                            </div>
                          </div>
                        </div>
                        <div className={SceneStyles.pointerContentText}>
                          {element.text}
                        </div>
                      </div>
                    </div>
                  </Pointer>
                );
              })
            : undefined}
        </group>
        <sphereGeometry args={[1, 128, 256]} />
        <meshStandardMaterial
          color={"#295BFB"}
          roughness={0.75}
          metalness={0.5}
          roughnessMap={specularColorMap}
          metalnessMap={colorMap}
          bumpMap={colorMap}
          bumpScale={0.03}
          map={toneColorMap}
        />
      </mesh>
    );
  }

  function Atmosphere(props) {
    const sphereMaterial = useRef();

    const ref = useRef();
    return (
      <mesh {...props} ref={ref} scale={2.5}>
        <sphereGeometry args={[1.01, 256, 256]} />
        <sphereMaterial
          ref={sphereMaterial}
          blending={AdditiveBlending}
          side={BackSide}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
    );
  }

  function Pointer({ children, ...props }) {
    const [occluded, occlude] = useState();
    return (
      <Html
        // 3D-transform contents
        transform={0}
        // Hide contents "behind" other meshes
        occlude
        // Tells us when contents are occluded (or not)
        onOcclude={occlude}
        // We just interpolate the visible state into css opacity and transforms
        style={{
          transition: "all 0.2s",
          opacity: occluded ? 0 : 1,
          transform: `scale(${occluded ? 0.25 : 1})`,
        }}
        {...props}
      >
        {children}
      </Html>
    );
  }

  return (
    <div
      className="app-scene"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      <Canvas dpr={[1, 2]}>
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[-10, 2, 2]}
          lookAt={[0, 0, 0]}
          intensity={2.5}
          color={"green"}
        />
        <directionalLight
          position={[-10, 5, 4]}
          lookAt={[0, 0, 0]}
          intensity={1.5}
          color={"#995BFB"}
        />
        <directionalLight
          position={[10, -5, -3]}
          lookAt={[0, 0, 0]}
          intensity={0.25}
        />
        <Suspense>
          <Globe position={[0, 0, 0]} rotation={[Math.PI / 6, -2, 0]} />
        </Suspense>
        <Atmosphere position={[-0.07, 0.07, 0]} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Scene;
