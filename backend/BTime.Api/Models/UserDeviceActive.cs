using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BTime.Api.Models
{
    [Table("UserDeviceActive")]
    public class UserDeviceActive
    {
        public Guid Id { get; set; }
        public Guid R_UserId { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiryTime { get; set; }
        [MaxLength(100)]
        public string? DeviceInfo { get; set; }
        [MaxLength(50)]
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [ForeignKey("R_UserId")]
        public virtual Users? User { get; set; }
    }
}