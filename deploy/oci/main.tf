# Oracle Cloud Infrastructure (OCI) Terraform Configuration

variable "tenancy_ocid" {}
variable "user_ocid" {}
variable "fingerprint" {}
variable "private_key_path" {}
variable "region" {
  default = "us-ashburn-1"
}
variable "compartment_ocid" {}
variable "ssh_public_key" {}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# 1. Network (VCN & Subnet)
resource "oci_core_vcn" "doorli_vcn" {
  compartment_id = var.compartment_ocid
  cidr_block     = "10.0.0.0/16"
  display_name   = "doorli_vcn"
  dns_label      = "doorlivcn"
}

resource "oci_core_internet_gateway" "doorli_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.doorli_vcn.id
  display_name   = "doorli_igw"
  enabled        = true
}

resource "oci_core_route_table" "doorli_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.doorli_vcn.id
  display_name   = "doorli_rt"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.doorli_igw.id
  }
}

resource "oci_core_security_list" "doorli_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.doorli_vcn.id
  display_name   = "doorli_sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Allow HTTP for API and UI
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Open ports used in docker-compose (3001 for API, 3006 for NextJS)
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 3001
      max = 3001
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 3006
      max = 3006
    }
  }
}

resource "oci_core_subnet" "doorli_subnet" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.doorli_vcn.id
  cidr_block          = "10.0.1.0/24"
  display_name        = "doorli_subnet"
  route_table_id      = oci_core_route_table.doorli_rt.id
  security_list_ids   = [oci_core_security_list.doorli_sl.id]
  dns_label           = "doorlisubnet"
}

# Get Availability Domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

# 2. Compute Instance
resource "oci_core_instance" "doorli_compute" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "doorli_super_admin"
  shape               = "VM.Standard.E4.Flex"

  shape_config {
    ocpus         = 2
    memory_in_gbs = 16
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.doorli_subnet.id
    assign_public_ip = true
  }

  # Oracle Linux 8 image
  source_details {
    source_type = "image"
    # Find latest Oracle Linux 8 image OCID for your region
    source_id   = "ocid1.image.oc1.iad.aaaaaaaaxxxxxx" 
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yaml"))
  }
}

output "public_ip" {
  value = oci_core_instance.doorli_compute.public_ip
}
