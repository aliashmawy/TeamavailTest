resource "aws_db_subnet_group" "wp_rds_subnet_group" {
  name       = "teamavail_rds_sg"
  subnet_ids = module.vpc.private_subnets
  tags = {
    Name = "teamavail_rds_sg"
  }
}

resource "aws_security_group" "rdssecuritygroup" {
  name        = "rds_security_group"
  description = "Allow inbound traffic only for MYSQL and all outbound traffic"
  vpc_id      = module.vpc.vpc_id
  tags = {
    Name = "rds_security_group"
  }
}

resource "aws_vpc_security_group_egress_rule" "rds_allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.rdssecuritygroup.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "rds_allow_http_ipv4" {
  security_group_id = aws_security_group.rdssecuritygroup.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 5432
  ip_protocol       = "tcp"
  to_port           = 5432
}

resource "aws_db_parameter_group" "custom_parameter_group" {
  name   = "rds-pg"
  family = "postgres17"

  parameter {
    name  = "rds.force_ssl"
    value = 0
  }
}

data "aws_secretsmanager_secret" "db_password" {
  name = aws_secretsmanager_secret.db_password.name

}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

resource "aws_db_instance" "teamavail-db" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "17.4"
  db_name              = "teamavaildb"
  instance_class       = "db.t3.micro"
  username             = "teamavail"
  password             = data.aws_secretsmanager_secret_version.db_password.secret_string
  parameter_group_name = aws_db_parameter_group.custom_parameter_group.name
  vpc_security_group_ids = [aws_security_group.rdssecuritygroup.id]
  db_subnet_group_name   = aws_db_subnet_group.wp_rds_subnet_group.name
  skip_final_snapshot  = true
  
  
}