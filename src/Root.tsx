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
  RestaurantVideo,
  calculateRestaurantVideoMetadata,
  restaurantVideoDefaultProps,
} from "./RestaurantVideo";
import {
  IndustryVideo,
  calculateIndustryVideoMetadata,
  industryVideoDefaultProps,
} from "./IndustryVideo";
import {
  IndustryVideoV1,
  calculateIndustryVideoV1Metadata,
  industryVideoV1DefaultProps,
} from "./IndustryVideoV1";
import {
  IndustryVideoV2,
  calculateIndustryVideoV2Metadata,
  industryVideoV2DefaultProps,
} from "./IndustryVideoV2";
import {
  IndustryVideoV3,
  calculateIndustryVideoV3Metadata,
  industryVideoV3DefaultProps,
} from "./IndustryVideoV3";
import {
  IndustryVideoV4,
  calculateIndustryVideoV4Metadata,
  industryVideoV4DefaultProps,
} from "./IndustryVideoV4";
import {
  IndustryVideoV5,
  calculateIndustryVideoV5Metadata,
  industryVideoV5DefaultProps,
} from "./IndustryVideoV5";
import {
  IndustryVideoV6,
  calculateIndustryVideoV6Metadata,
  industryVideoV6DefaultProps,
} from "./IndustryVideoV6";

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
        id="RestaurantVideo"
        component={RestaurantVideo}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={restaurantVideoDefaultProps}
        calculateMetadata={calculateRestaurantVideoMetadata}
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
      <Composition
        id="IndustryVideoV1"
        component={IndustryVideoV1}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV1DefaultProps}
        calculateMetadata={calculateIndustryVideoV1Metadata}
      />
      <Composition
        id="IndustryVideoV2"
        component={IndustryVideoV2}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV2DefaultProps}
        calculateMetadata={calculateIndustryVideoV2Metadata}
      />
      <Composition
        id="IndustryVideoV3"
        component={IndustryVideoV3}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV3DefaultProps}
        calculateMetadata={calculateIndustryVideoV3Metadata}
      />
      <Composition
        id="IndustryVideoV4"
        component={IndustryVideoV4}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV4DefaultProps}
        calculateMetadata={calculateIndustryVideoV4Metadata}
      />
      <Composition
        id="IndustryVideoV5"
        component={IndustryVideoV5}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV5DefaultProps}
        calculateMetadata={calculateIndustryVideoV5Metadata}
      />
      <Composition
        id="IndustryVideoV6"
        component={IndustryVideoV6}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={industryVideoV6DefaultProps}
        calculateMetadata={calculateIndustryVideoV6Metadata}
      />
    </>
  );
};
