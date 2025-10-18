import * as React from "react";
import Svg, { SvgProps, G, Path, Defs } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
const StayConfirmedBackground = (props: SvgProps) => (
  <Svg width={276} height={360} fill="none" viewBox="0 0 276 360" {...props}>
    <G filter="url(#a)">
      <Path
        fill={props.fill ?? "#fff"}
        d="M12 23.8a15.75 15.75 0 0 1 25.295-12.528L43.5 16C51.375 5.5 67.125 5.5 75 16c7.875-10.5 23.625-10.5 31.5 0 7.875-10.5 23.625-10.5 31.5 0 7.875-10.5 23.625-10.5 31.5 0 7.875-10.5 23.625-10.5 31.5 0 7.875-10.5 23.625-10.5 31.5 0l6.205-4.727A15.75 15.75 0 0 1 264 23.8v304.398a15.75 15.75 0 0 1-25.295 12.528L232.5 336c-7.875 10.5-23.625 10.5-31.5 0-7.875 10.5-23.625 10.5-31.5 0-7.875 10.5-23.625 10.5-31.5 0-7.875 10.5-23.625 10.5-31.5 0-7.875 10.5-23.625 10.5-31.5 0-7.875 10.5-23.625 10.5-31.5 0l-6.205 4.727a15.75 15.75 0 0 1-19.09 0A15.748 15.748 0 0 1 12 328.199V23.801Z"
      />
    </G>
    <Defs></Defs>
  </Svg>
);
export default StayConfirmedBackground;
