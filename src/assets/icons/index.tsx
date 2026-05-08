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

import LogoHtml from "./skills/IconLogoHtml.svg";
import LogoCss from "./skills/IconLogoCss.svg";
import LogoJs from "./skills/IconLogoJs.svg";
import LogoTs from "./skills/IconLogoTs.svg";
import LogoReact from "./skills/IconLogoReact.svg";
import LogoNextjs from "./skills/IconLogoNextjs.svg";
import LogoFigma from "./skills/IconLogoFigma.svg";

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

export const IconLogoHtml = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoHtml />
  </IconWrapper>
);

export const IconLogoCss = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoCss />
  </IconWrapper>
);

export const IconLogoJs = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoJs />
  </IconWrapper>
);

export const IconLogoTs = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoTs />
  </IconWrapper>
);

export const IconLogoReact = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoReact />
  </IconWrapper>
);

export const IconLogoNextjs = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoNextjs />
  </IconWrapper>
);

export const IconLogoFigma = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoFigma />
  </IconWrapper>
);
