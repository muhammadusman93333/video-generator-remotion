import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./Video";
import {
  PosVideo,
  calculatePosVideoMetadata,
  posVideoDefaultProps,
} from "./PosVideo";
import {
  SocialPromoVideo,
  calculateSocialPromoVideoMetadata,
  socialPromoVideoDefaultProps,
} from "./SocialPromoVideo";
import {
  IndustryVideo,
  calculateIndustryVideoMetadata,
  industryVideoDefaultProps,
} from "./IndustryVideo";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialPromoVideo"
        component={SocialPromoVideo}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={socialPromoVideoDefaultProps}
        calculateMetadata={calculateSocialPromoVideoMetadata}
      />
      <Composition
        id="PosVideo"
        component={PosVideo}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={posVideoDefaultProps}
        calculateMetadata={calculatePosVideoMetadata}
      />
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={360}
        fps={30}
        width={540}
        height={960}
        defaultProps={{
          imageUrl:
            "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
          audioUrl: "",
          backgroundMusicUrl: "http://localhost:3000/assets/mixkit-wedding-01-657.mp3",
          text: "Kya aap thak chuke hain manual billing se?\nUPOS offers automated invoicing that saves you hours of stock tallying time every day at closing time!",
        }}
      />
      <Composition
        id="IndustryVideo"
        component={IndustryVideo}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoDefaultProps}
        calculateMetadata={calculateIndustryVideoMetadata}
      />
    </>
  );
};
