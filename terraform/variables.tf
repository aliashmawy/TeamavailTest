variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of project for ecs"
  type        = string
  default     = "teamavail"
}

variable "environment" {
  description = "ecs environment"
  type        = string
  default     = "production"
}