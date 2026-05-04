import React from "react";

import { IconWrapper } from "../../components";

import LogoTelegram from "./IconLogoTelegram.svg";
import LogoInstagram from "./IconLogoInstagram.svg";
import LogoVK from "./IconLogoVK.svg";
import LogoThreads from "./IconLogoThreads.svg";
import LogoGitHub from "./IconLogoGitHub.svg";
import Code from "./IconCode.svg";
import Prototype from "./IconPrototype.svg";
import Pen from "./IconPen.svg";
import Layers from "./IconLayers.svg";

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  viewBox?: string;
  strokeWidth?: number;
}

export const IconLogoTelegram = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoTelegram />
  </IconWrapper>
);

export const IconLogoInstagram = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoInstagram />
  </IconWrapper>
);

export const IconLogoVK = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoVK />
  </IconWrapper>
);

export const IconLogoThreads = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoThreads />
  </IconWrapper>
);

export const IconLogoGitHub = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoGitHub />
  </IconWrapper>
);

export const IconCode = (props: IconProps) => (
  <IconWrapper {...props}>
    <Code />
  </IconWrapper>
);

export const IconPrototype = (props: IconProps) => (
  <IconWrapper {...props}>
    <Prototype />
  </IconWrapper>
);

export const IconPen = (props: IconProps) => (
  <IconWrapper {...props}>
    <Pen />
  </IconWrapper>
);

export const IconLayers = (props: IconProps) => (
  <IconWrapper {...props}>
    <Layers />
  </IconWrapper>
);
