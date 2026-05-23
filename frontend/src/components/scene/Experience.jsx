import React from 'react';
import { OrbitControls } from '@react-three/drei';
import ClassroomModel from './ClassroomModel';

const Experience = ({ videoRef, screenStream }) => {
	return (
		<>
			<ambientLight intensity={1.0} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			<hemisphereLight intensity={1.5} skyColor="#ffffff" groundColor="#bbbbff" />
			<OrbitControls />

			<ClassroomModel videoRef={videoRef} screenStream={screenStream} />
		</>
	);
};

export default Experience;