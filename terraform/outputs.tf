output "ECS_TASK_PUBLIC_IP" {
    value = data.aws_network_interface.interface_tags.association[0].public_ip
}