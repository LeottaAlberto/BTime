namespace BTime.Api.Enums;

[System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
public enum MediaType: short
{
    Movie = 1,
    Episode = 2
}